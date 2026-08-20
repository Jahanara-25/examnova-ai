const features = [
  {
    title: 'AI-Powered Questioning',
    description: 'Generate adaptive assessments that align with curriculum and learner level.',
  },
  {
    title: 'Real-Time Insights',
    description: 'Track performance instantly with dashboards for learners and educators.',
  },
  {
    title: 'Secure Proctoring',
    description: 'Protect exams with role-based access, integrity checks, and controlled workflows.',
  },
  {
    title: 'Seamless Collaboration',
    description: 'Support students, teachers, and administrators in one unified experience.',
  },
];

const modules = [
  {
    title: 'MCQ Exams',
    description: 'Interactive multiple-choice assessments with instant evaluation and analytics.',
  },
  {
    title: 'Descriptive Review',
    description: 'Enable long-form evaluations with structured rubrics and feedback loops.',
  },
  {
    title: 'Live Quizzes',
    description: 'Run timed, engaging exams for classrooms, training sessions, and reviews.',
  },
];

const faqs = [
  {
    question: 'Who can use examnova.ai?',
    answer: 'The platform supports students, teachers, and administrators through role-specific experiences.',
  },
  {
    question: 'Can the platform scale for institutions?',
    answer: 'Yes. The design supports multiple exam programs, large candidate groups, and centralized oversight.',
  },
  {
    question: 'Is there a public demo login?',
    answer: 'The role-based login flow includes demo accounts for each user category.',
  },
];

export default function LandingPage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">AI-POWERED INTELLIGENT EXAMINATION PLATFORM</p>
            <h1>examnova.ai</h1>
            <p className="hero-tagline">(ai powered intelligent examination platform)</p>
            <p className="hero-copy">
              Deliver smarter assessments, faster feedback, and secure evaluation experiences for every learner and educator.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/auth/role-selection">
                Get Started
              </a>
              <a className="button button-secondary" href="#features">
                Learn More
              </a>
            </div>
          </div>
          <div className="hero-card">
            <h3>Why institutions choose examnova.ai</h3>
            <ul>
              <li>Adaptive assessments built for modern learning</li>
              <li>Actionable insights for teaching and assessment teams</li>
              <li>Secure role-aware workflows from start to finish</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Platform Benefits</p>
            <h2>Everything you need for intelligent examinations</h2>
          </div>
          <div className="card-grid">
            {features.map((feature) => (
              <article className="info-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="section muted-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Core Modules</p>
            <h2>Flexible exam formats for every learning scenario</h2>
          </div>
          <div className="card-grid">
            {modules.map((module) => (
              <article className="info-card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="container two-col">
          <div>
            <p className="eyebrow">About</p>
            <h2>Purpose-built for modern assessment teams</h2>
            <p>
              examnova.ai combines intelligent content generation, real-time analytics, and secure role-based access to make examinations more accurate, efficient, and engaging.
            </p>
          </div>
          <div className="info-card">
            <h3>Trusted by forward-looking programs</h3>
            <p>From classroom assessments to institutional evaluations, the platform supports a clear and dependable path from creation to analysis.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="section muted-section">
        <div className="container contact-box">
          <h2>Ready to transform the exam experience?</h2>
          <p>Reach out to explore how examnova.ai can support your organization.</p>
          <a className="button button-primary" href="mailto:hello@examnova.ai">
            Contact Us
          </a>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Common questions</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <article className="faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
