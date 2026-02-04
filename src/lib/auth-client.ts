"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
   baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
  fetchOptions: {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : ""}`,
      },
      onSuccess: (ctx) => {
          const authToken = ctx.response.headers.get("set-auth-token")
          // Store the FULL token - don't split it!
          if(authToken){
            localStorage.setItem("bearer_token", authToken);
          }
      }
  }
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession(): SessionData {
   const [session, setSession] = useState<any>(null);
   const [isPending, setIsPending] = useState(true);
   const [error, setError] = useState<any>(null);

   const refetch = async () => {
      setIsPending(true);
      setError(null);
      await fetchSession();
   };

   const fetchSession = async () => {
      try {
         const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : "";
         
         if (!token) {
            setSession(null);
            setError(null);
            setIsPending(false);
            return;
         }

         const res = await authClient.getSession({
            fetchOptions: {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            },
         });
         
         setSession(res.data);
         setError(null);
      } catch (err) {
         console.error("Session fetch error:", err);
         setSession(null);
         setError(err);
      } finally {
         setIsPending(false);
      }
   };

   useEffect(() => {
      fetchSession();
   }, []);

   return { data: session, isPending, error, refetch };
}