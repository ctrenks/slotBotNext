import "./globals.css";
import AuthContext from "./components/SessionProvider";
import AuthWrapper from "./components/AuthWrapper";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthContext>
          <AuthWrapper>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="container mx-auto max-w-[1280px] px-4">
                {children}
              </main>
              <Footer />
            </div>
          </AuthWrapper>
        </AuthContext>
      </body>
    </html>
  );
}
