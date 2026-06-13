import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser for JSON
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Supabase Admin Client
  const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  };

  // POST /api/users - Create User (Admin Only)
  app.post("/api/users", async (req, res) => {
    try {
      // Very basic security: Expect the authorization header to have the JWT
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Missing authorization header" });
      }

      const token = authHeader.replace("Bearer ", "");
      const supabaseAdmin = getSupabaseAdmin();

      // 1. Verify the calling user is SuperAdmin using the token
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Check role in users_profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("users_profile")
        .select("role")
        .eq("id", user.id)
        .single();
        
      if (profileError || profile?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Unauthorized: Only SuperAdmin can perform this action" });
      }

      // 2. We are admin, proceed to create account
      const { email, password, nama_lengkap, role } = req.body;
      
      if (!email || !password || !nama_lengkap || !role) {
         return res.status(400).json({ error: "Missing required fields" });
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
           nama_lengkap
        }
      });

      if (createError) {
        throw createError;
      }

      if (newUser.user) {
        // Create profile manually to avoid race conditions with trigger or explicitly set role
        // The trigger in the DB might try to set the role to 'Pendaftaran'.
        // We will need to update it immediately after.
        const { error: upsertError } = await supabaseAdmin
          .from("users_profile")
          .upsert({
            id: newUser.user.id,
            nama_lengkap,
            role
          }, { onConflict: "id" });

         if (upsertError) {
            console.error("Failed to upsert profile, attempting update:", upsertError);
            // Fallback: If upsert failed because of the trigger, try an update
            const { error: updateError } = await supabaseAdmin
              .from("users_profile")
              .update({
                nama_lengkap,
                role
              })
              .eq('id', newUser.user.id);
            if(updateError) console.error("Final update error:", updateError);
         }
      }

      res.status(200).json({ success: true, user: newUser.user });
    } catch (error: any) {
      console.error("User creation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
