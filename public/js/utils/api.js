export async function fetchLocais() {
  const response = await fetch("http://localhost:3000/api/locais");
  if (!response.ok) throw new Error("Erro na requisição");
  return response.json();
}
