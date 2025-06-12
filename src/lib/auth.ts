import { jwtVerify } from "jose"

interface TokenPayload {
  id: number
  username: string
  role: string
}

function isTokenPayload(payload: unknown): payload is TokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    "username" in payload &&
    "role" in payload &&
    typeof (payload as TokenPayload).id === "string" &&
    typeof (payload as TokenPayload).username === "string" &&
    typeof (payload as TokenPayload).role === "string"
  )
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    )
    const { payload } = await jwtVerify(token, secret)

    if (isTokenPayload(payload)) {
      return payload
    }
    return null
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}
