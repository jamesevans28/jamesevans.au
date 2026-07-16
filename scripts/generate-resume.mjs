/**
 * Generates public/resume.pdf from the same typed resume data the site uses,
 * so the downloadable PDF never drifts from the Experience page. Run via
 * `npm run resume`. Uses pdfkit (dev dependency).
 *
 * Kept deliberately plain and ATS-friendly: single column, real text (not
 * images), standard fonts, clear headings.
 */
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// Import the resume data straight from the content module (TS via tsx loader).
const exp = await import(
  pathToFileURL(resolve(root, 'src/content/experience.ts')).href
);
const siteMod = await import(
  pathToFileURL(resolve(root, 'src/content/site.ts')).href
);
const site = siteMod.site;
const {
  resumeHeadline,
  professionalSummary,
  roles,
  earlierRoles,
  skills,
  education,
} = exp;

function fmtMonth(v) {
  if (v === 'present') return 'Present';
  const [y, m] = v.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${y}`;
}

const INK = '#0e0e1a';
const MUTED = '#4e4e66';
const VOLT = '#2337ff';

const doc = new PDFDocument({ size: 'A4', margins: { top: 54, bottom: 54, left: 54, right: 54 } });
doc.pipe(createWriteStream(resolve(root, 'public/resume.pdf')));

// Header
doc.fillColor(INK).font('Helvetica-Bold').fontSize(24).text(site.name);
doc.moveDown(0.15);
doc.fillColor(VOLT).font('Helvetica-Bold').fontSize(12).text(resumeHeadline.toUpperCase(), { characterSpacing: 1 });
doc.moveDown(0.15);
doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(`${site.location}  |  ${site.email}  |  ${site.url}`);
doc.moveDown(0.8);

// Summary
doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text('SUMMARY', { characterSpacing: 1 });
doc.moveDown(0.25);
doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(professionalSummary, { lineGap: 2 });
doc.moveDown(0.7);

// Skills
doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text('SKILLS', { characterSpacing: 1 });
doc.moveDown(0.25);
doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(skills.join('  ·  '), { lineGap: 2 });
doc.moveDown(0.7);

// Experience
doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text('EXPERIENCE', { characterSpacing: 1 });
doc.moveDown(0.35);
for (const r of roles) {
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(r.title, { continued: false });
  doc.fillColor(VOLT).font('Helvetica').fontSize(9.5).text(`${r.company}  |  ${r.location}  |  ${fmtMonth(r.start)} to ${fmtMonth(r.end)}`);
  doc.moveDown(0.2);
  doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(r.summary, { lineGap: 1.5 });
  if (r.highlights) {
    doc.moveDown(0.15);
    for (const h of r.highlights) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(`•  ${h}`, { indent: 8, lineGap: 1.5 });
    }
  }
  doc.moveDown(0.5);
}

// Earlier career
doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text('EARLIER CAREER', { characterSpacing: 1 });
doc.moveDown(0.25);
for (const e of earlierRoles) {
  doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(`${e.years}  —  ${e.title}, ${e.company}, ${e.location}`.replace('—', 'to'), { lineGap: 1.5 });
}
doc.moveDown(0.6);

// Education
doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text('EDUCATION', { characterSpacing: 1 });
doc.moveDown(0.25);
for (const ed of education) {
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(ed.qualification);
  doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(`${ed.institution}  |  ${ed.years}`);
}

doc.end();
console.log('Wrote public/resume.pdf');
