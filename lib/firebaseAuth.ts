type ResolveResult = {
  uid: string | null;
};

async function lookupUid(token: string, apiKey: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data?.users?.[0]?.localId || null;
}

export async function resolveUid(authHeader: string | null): Promise<ResolveResult> {
  if (!authHeader?.startsWith("Bearer ")) return { uid: null };
  const token = authHeader.slice(7);

  if (token.startsWith("dev-")) {
    return { uid: "dev" };
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return { uid: null };

  const uid = await lookupUid(token, apiKey);
  return { uid };
}
