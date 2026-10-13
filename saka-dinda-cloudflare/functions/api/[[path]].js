
export async function onRequest({ request, env }) {
  if (!env.WEDDING_API) {
    return Response.json(
      { error: "WEDDING_API binding tidak ditemukan" },
      { status: 503 }
    );
  }

  try {
    return await env.WEDDING_API.fetch(request);
  } catch (error) {
    console.error("Wedding API error:", error);
    return Response.json(
      { error: "Gagal menghubungi API undangan" },
      { status: 502 }
    );
  }
}
