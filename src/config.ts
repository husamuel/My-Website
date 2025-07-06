import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Hugo Leonor",
	subtitle: "My blog",
	lang: "en", // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
	enable: true, // <- Ativa o banner
	src: "https://plus.unsplash.com/premium_photo-1681930071839-e5fbf9fae636?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	credit: {
		enable: false, // <- Mostra o crédito
		text: "",
		url: "",
		},
	},

	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
	{
		src: 'https://img.icons8.com/?size=100&id=79750&format=png&color=000000',  // supondo que você colocou o arquivo aqui
		sizes: '120x120',           // ou 32x32, 64x64, o que for
	},
	],

};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "LinkedIn",
			url: "https://www.linkedin.com/in/hugo-leonor-a60710249/", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "https://cdn.intra.42.fr/users/5e1d4f5558ad869321eef8a92cf2a29b/husamuel.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Hugo Leonor",
	bio: "Student at 42 Porto and passionate about cybersecurity",
	links: [
		{
			name: "Linkedin",
			icon: "fa6-brands:linkedin",
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://www.linkedin.com/in/hugo-leonor-a60710249",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/husamuel",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
