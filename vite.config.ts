import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	optimizeDeps: {
		exclude: [
			// "@prisma/client",
			// ".prisma/client",
			".prisma/client/default",
			".prisma/client/index-browser",
		],
	},
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
