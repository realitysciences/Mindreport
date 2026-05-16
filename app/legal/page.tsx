export const metadata = {
  title: 'Legal & Disclaimer | Mind Report',
  alternates: {
    canonical: 'https://mindreport.ai/legal',
  },
}

const sections = [
  {
    heading: 'Nature of This Publication',
    body: `Mind Report is a publication of interpretive opinion and psychological cartography. All maps published on this site are analytical frameworks drawn from publicly available information - published interviews, books, documentaries, public statements, and the public record. They represent interpretive readings, not clinical assessments, diagnoses, legal conclusions, or statements of established fact about any person's motivations, psychology, or conduct.`,
  },
  {
    heading: 'No Clinical or Professional Relationship',
    body: `Nothing on this site constitutes a clinical assessment, psychological evaluation, medical opinion, or therapeutic advice. No subject featured on Mind Report has participated in a ReLoHu session. No featured subject has reviewed, approved, or endorsed the content about them. Mind Report does not establish any professional or clinical relationship with readers or subjects.`,
  },
  {
    heading: 'Public Figures and Public Record',
    body: `All subjects featured on Mind Report are public figures whose public conduct, public statements, and publicly disclosed personal histories form the basis of each map. No private information, confidential communications, or non-public material has been used. All analysis is based on information the subject has voluntarily made public or that has been reported in the public record.`,
  },
  {
    heading: 'Opinion and Commentary',
    body: `All interpretive content on this site - including terrain map labels, body text, deck summaries, and marker terminology - constitutes opinion and analytical commentary protected under applicable law. Phrases such as "the wound is," "the pattern suggests," and similar formulations represent ReLoHu's interpretive framework, not assertions of clinical or factual certainty. Readers should understand all such language as shorthand for "in this interpretive reading."`,
  },
  {
    heading: 'No Defamatory Intent',
    body: `Mind Report does not intend to defame, harm, or make false statements of fact about any person. If you are a subject of a map and believe factually inaccurate information has been published about you, please contact us and we will review the content promptly.`,
  },
  {
    heading: 'Copyright',
    body: `All original written content on this site is © ${new Date().getFullYear()} mindreport.ai. All rights reserved. Reproduction or republication without permission is prohibited.`,
  },
  {
    heading: 'Content Removal and Corrections',
    body: `If you are a subject of a map, or represent a subject, and wish to request a correction or removal, email realitysciences@gmail.com with the subject line "Content Request." Please include the URL of the page in question and a description of your concern. All requests are reviewed and responded to promptly. You may also use the /contact page.`,
  },
]

export default function LegalPage() {
  return (
    <div className="px-8 py-16">
      <div className="mx-auto" style={{ maxWidth: '680px' }}>

        <div className="mb-12">
          <span
            className="text-[0.65rem] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
          >
            Legal &amp; Disclaimer
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-5"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '2.25rem', letterSpacing: '-0.02em' }}
          >
            Terms of publication
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)' }}
          >
            Mind Report publishes interpretive opinion, not clinical assessment. These terms explain what that means and what it doesn't.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {sections.map(({ heading, body }) => (
            <div key={heading} style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <h2
                className="text-[0.65rem] uppercase tracking-widest mb-3"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
              >
                {heading}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', lineHeight: '1.9' }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
