// import { getToken } from "next-auth/jwt";
// import type { NextRequest } from "next/server";

// export async function GET(req: NextRequest) {
//     const token = await getToken({
//         req,
//         secret: process.env.AUTH_SECRET
//     });

//     console.log("Decoded NextAuth token:", token);

//     return new Response(
//         JSON.stringify(token, null, 2),
//         { headers: { "Content-Type": "application/json" } }
//     );
// }