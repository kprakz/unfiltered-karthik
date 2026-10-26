import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import BinaryRain from "./BinaryRain";

// Your photo: save it in the `public` folder as me.jpg, me.png or me.webp. Without one, the page shows your initial.
const photo = ["me.jpg", "me.jpeg", "me.png", "me.webp"].find((file) =>
  existsSync(path.join(process.cwd(), "public", file)),
);

// Everything on the page lives in these lists: add a project or a link here and it shows up.

const profile = {
  name: "Karthik",
  handle: "unfiltered_karthik",
  bio: "One small step each day towards an easy life",
};

const projects = [
  {
    name: "Ladderly",
    tagline: "Type any skill and get a step-by-step learning path, from zero to competent.",
    url: "https://ladderly.vercel.app",
    status: "Live",
  },
  {
    name: "HOMEFLIX",
    tagline: "Your own Netflix at home: watch the movies on your PC or Mac from your phone, iPad or TV.",
    url: "https://kprakz.github.io/homeflix/",
    status: "Live",
  },
];

const links = [
  { label: "GitHub", url: "https://github.com/kprakz", icon: "github" },
  { label: "LinkedIn", url: "https://www.linkedin.com/in/kprakz/", icon: "linkedin" },
] as const;

/** Small brand-neutral glyphs for the social buttons. */
function Icon({ name }: { name: (typeof links)[number]["icon"] }) {
  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
      <path d="M7 17 17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The link-in-bio page: profile, projects and social links in one mobile-first column.
 * @returns {JSX.Element} The home page.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-12">
      <BinaryRain />
      <header className="rise flex flex-col items-center text-center">
        {photo ? (
          <Image
            src={`/${photo}`}
            alt={profile.name}
            width={192}
            height={192}
            loading="eager"
            className="h-24 w-24 rounded-full border-2 border-green-500/70 object-cover shadow-[0_0_30px_rgba(34,197,94,0.35)]"
          />
        ) : (
          <div className="glow flex h-24 w-24 items-center justify-center rounded-full border-2 border-green-500/70 bg-black/70 font-mono text-4xl font-bold text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.35)]">
            {profile.name[0]}
          </div>
        )}
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">{profile.name}</h1>
        <p className="glow font-mono text-sm text-green-400">@{profile.handle}</p>
        <p className="cursor mt-3 text-balance font-mono text-sm text-green-100/90">&gt; {profile.bio}</p>
      </header>

      <section className="rise mt-10 [animation-delay:100ms]">
        <h2 className="glow mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-green-400">
          $ what_im_building
        </h2>
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.name}>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl border border-green-500/25 bg-black/70 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-semibold">
                    {project.name}
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 font-mono text-xs font-medium text-green-300">
                      {project.status}
                    </span>
                  </span>
                  <span className="text-zinc-500 transition group-hover:text-green-400">
                    <ArrowIcon />
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{project.tagline}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rise mt-8 [animation-delay:200ms]">
        <h2 className="glow mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-green-400">
          $ find_me
        </h2>
        <ul className="space-y-3">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-green-500/25 bg-black/70 px-4 py-3 font-medium backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              >
                <Icon name={link.icon} />
                <span className="flex-1">{link.label}</span>
                <span className="text-zinc-500">
                  <ArrowIcon />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto pt-12 text-center font-mono text-xs text-green-500/60">
        © {new Date().getFullYear()} {profile.name}
      </footer>
    </main>
  );
}
