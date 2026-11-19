/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // os modelos e o catálogo são lidos do disco em tempo de execução
  outputFileTracingIncludes: { "/api/**": ["./kit/**/*"] },
  serverExternalPackages: ["sharp"],
};
export default nextConfig;
