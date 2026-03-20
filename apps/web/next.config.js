const { withAmplifyHosting } = require("@aws-amplify/adapter-nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = withAmplifyHosting({
  transpilePackages: [
    "@govtech-bb/form-types",
    "@govtech-bb/form-conditions",
    "@govtech-bb/form-registry",
  ],
});

module.exports = nextConfig;