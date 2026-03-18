import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Menu Editor"',
    },
  });
}

export function proxy(request: NextRequest) {
  if (
    !request.nextUrl.pathname.startsWith("/edit") &&
    !request.nextUrl.pathname.startsWith("/upload")
  ) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const base64Credentials = authHeader.split(" ")[1] || "";
  let credentials = "";

  try {
    credentials = atob(base64Credentials);
  } catch {
    return unauthorizedResponse();
  }

  const separator = credentials.indexOf(":");
  if (separator < 0) {
    return unauthorizedResponse();
  }

  const username = credentials.slice(0, separator);
  const password = credentials.slice(separator + 1);

  const expectedUsername = process.env.EDIT_USERNAME || "admin";
  const expectedPassword = process.env.EDIT_PASSWORD || "change-this-password";

  if (username !== expectedUsername || password !== expectedPassword) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/edit/:path*", "/upload/:path*"],
};
