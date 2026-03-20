/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: [
    "@govtech-bb/form-types",
    "@govtech-bb/form-conditions",
    "@govtech-bb/form-registry",
  ],
};

module.exports = nextConfig;