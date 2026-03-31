const { withAmplifyHosting } = require("@aws-amplify/adapter-nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@govtech-bb/form-types",
    "@govtech-bb/form-conditions",
    "@govtech-bb/form-registry",
  ],
};

module.exports = withAmplifyHosting(nextConfig);
