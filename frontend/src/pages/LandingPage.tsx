import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <section className="landing">
      <div className="card hero-card">
        <p className="eyebrow">Social bookmarking for teams</p>
        <h1>Capture the links that matter, and let your team reuse them.</h1>
        <p className="lead">
          Bookmarking Studio is a social space for research, product discovery, and knowledge sharing.
          Save links, add tags, and build shared context in minutes.
        </p>
        <div className="actions">
          <Link className="btn" to="/signup">Get started</Link>
          <Link className="btn ghost" to="/feed">Explore public feed</Link>
        </div>
      </div>

      <div className="landing-grid">
        <div className="card">
          <h3>Save once, share everywhere</h3>
          <p className="lead">Keep a timeline of the resources your team is actually using.</p>
        </div>
        <div className="card">
          <h3>Tag with intent</h3>
          <p className="lead">Multi-tag input makes it easy to organize by topic.</p>
        </div>
        <div className="card">
          <h3>Private when needed</h3>
          <p className="lead">Choose public or private visibility on every bookmark.</p>
        </div>
      </div>
    </section>
  );
}
