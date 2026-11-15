import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle
} from "lucide-react";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Customer Support",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <div className="text-center max-w-lg mx-auto mb-5">
        <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">
          GET IN TOUCH
        </span>
        <h2 className="fw-bold mb-2">Contact & Marketplace Support</h2>
        <p className="text-muted small">
          Have inquiries about orders, vendor applications, or platform operations? Our support team is here to assist.
        </p>
      </div>

      <div className="row g-4 mb-5">
        {/* Contact Info Cards */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-3">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle bg-primary-subtle text-primary p-3">
                  <Mail size={22} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Email Support</h6>
                  <p className="text-muted small mb-0">support@vendora.com</p>
                  <p className="text-muted small mb-0">merchants@vendora.com</p>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle bg-success-subtle text-success p-3">
                  <Phone size={22} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Phone Assistance</h6>
                  <p className="text-muted small mb-0">+91 (800) 123-4567</p>
                  <p className="text-muted small mb-0">Mon - Sat (9:00 AM - 7:00 PM IST)</p>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle bg-warning-subtle text-warning p-3">
                  <MapPin size={22} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Headquarters</h6>
                  <p className="text-muted small mb-0">Vendora Technologies Pvt Ltd</p>
                  <p className="text-muted small mb-0">Cyber City, Gurugram, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
            <h4 className="fw-bold mb-2">Send Us a Message</h4>
            <p className="text-muted small mb-4">
              Fill in your details below and our team will get back to you within 24 business hours.
            </p>

            {submitted ? (
              <div className="alert alert-success d-flex align-items-center gap-3 rounded-4 p-4">
                <CheckCircle size={32} className="text-success flex-shrink-0" />
                <div>
                  <h6 className="fw-bold mb-1">Message Sent Successfully!</h6>
                  <p className="small mb-0 text-muted">
                    Thank you, {formData.name}. Ticket #VND-SUP-
                    {Math.floor(1000 + Math.random() * 9000)} has been created.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Your Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Roy"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Your Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. rahul@example.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Topic / Inquiry Type</label>
                    <select
                      className="form-select"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="Customer Support">Customer Order & Delivery Support</option>
                      <option value="Merchant Inquiry">Vendor Application & Storefront Inquiry</option>
                      <option value="Technical Issue">Platform Bug / Technical Assistance</option>
                      <option value="Partnership">Business Partnership</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Message</label>
                    <textarea
                      rows="4"
                      className="form-control"
                      placeholder="Describe your inquiry in detail..."
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button type="submit" className="btn btn-primary rounded-pill px-4 text-white d-inline-flex align-items-center gap-2">
                    <Send size={16} /> Submit Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
