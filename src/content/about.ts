/** The About-page narrative and values. First-person, warm, plain-spoken. */

export const aboutIntro =
  "I started out in New Zealand, spent a stretch in London, and have called Melbourne home for years now. Across all of it, one thing has stayed the same: I like taking something tangled and making it work.";

export const aboutParagraphs: string[] = [
  "Twenty-five years in, I still write code most weeks. I have led big teams, a graduate program of a hundred and fifty engineers, chapters of twenty and thirty, and the engineering behind a point-of-sale system in around four thousand stores, but I have never wanted to be the manager who forgot how the thing actually works.",
  "Lately a lot of that curiosity has gone into AI. I use Claude, Microsoft 365 Copilot and GitHub Copilot every day, in my Kairos work and at Australia Post, and I help other people and businesses fold the same tools into how they work. Not for the sake of it, but where it genuinely saves time and effort.",
  "That is really why the side work exists. Building and running Audify for Kairos Strategies keeps me hands-on: designing, shipping, and supporting a real product that people depend on in the field. And helping local businesses and individuals with their tech, the app, the network, the machine that will not behave, is some of the most satisfying work I do, because the difference is immediate.",
  "However complex the problem, I try to leave people with two things: something that works, and an understanding of why. No jargon for its own sake, no mystery, no lock-in.",
];

export const values = [
  {
    title: 'Still hands-on',
    body: 'A leader who codes. I stay close to the craft so the advice I give is grounded in doing, not just managing.',
  },
  {
    title: 'Plain English',
    body: 'Technology explained so you actually understand it. You should never feel talked down to or kept in the dark.',
  },
  {
    title: 'People first',
    body: 'A hundred and fifty engineers started their careers on a program I ran. Growing people is the part I am proudest of.',
  },
  {
    title: 'Done properly',
    body: 'Fixes that last and products that hold up. I would rather do it once, right, than twice.',
  },
] as const;
