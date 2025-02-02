import { NextRequest } from "next/server";
import { prisma } from "@/prisma";

interface RouteParams {
  params: {
    casino: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { casino } = params;

    // Find the casino by clean_name
    const casinoData = await prisma.casino_p_casinos.findFirst({
      where: {
        clean_name: casino,
        approved: 1,
        rogue: 0,
      },
      select: {
        id: true,
        url: true,
      },
    });

    if (!casinoData || !casinoData.url) {
      return new Response("Casino not found", { status: 404 });
    }

    // Ensure the URL has a protocol
    let redirectUrl = casinoData.url;
    if (!redirectUrl.startsWith("http")) {
      redirectUrl = "https://" + redirectUrl;
    }

    // Return an HTML page that opens the casino in a new window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script>
            window.onload = function() {
              // Open in new window
              window.open('${redirectUrl}', '_blank');

              // Redirect back to previous page
              window.location.href = document.referrer || '/';
            }
          </script>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #000;
              color: #00ff00;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            .spinner {
              width: 40px;
              height: 40px;
              margin: 20px auto;
              border: 3px solid #00ff00;
              border-radius: 50%;
              border-top-color: transparent;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <p>Opening casino in new window...</p>
            <p>If nothing happens, <a href="${redirectUrl}" target="_blank" style="color: #00ff00;">click here</a></p>
          </div>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error processing casino redirect:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
