import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  User,
  MapPin,
  Plus,
  Trash2,
  Package,
  Heart,
  ShieldCheck,
  Save
} from "lucide-react";

function Profile() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    postalCode: user?.address?.postalCode || "",
    country: user?.address?.country || "India"
  });

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // New Address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false
  });
  const [addingAddr, setAddingAddr] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      const res = await API.get("/auth/addresses");
      if (res.data.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      console.warn("Could not fetch addresses:", err.message);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await API.put("/auth/profile", {
        name: profileData.name,
        phone: profileData.phone,
        address: {
          street: profileData.street,
          city: profileData.city,
          state: profileData.state,
          postalCode: profileData.postalCode,
          country: profileData.country
        }
      });
      if (res.data.success) {
        setProfileMsg("Profile updated successfully!");
        refreshUser();
      }
    } catch (err) {
      setProfileMsg("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddingAddr(true);
    try {
      const res = await API.post("/auth/addresses", newAddr);
      if (res.data.success) {
        setShowAddAddress(false);
        setNewAddr({
          fullName: user?.name || "",
          phone: user?.phone || "",
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          isDefault: false
        });
        fetchAddresses();
      }
    } catch (err) {
      alert("Failed to add address: " + err.message);
    } finally {
      setAddingAddr(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const res = await API.delete(`/auth/addresses/${id}`);
      if (res.data.success) {
        fetchAddresses();
      }
    } catch (err) {
      alert("Failed to delete address: " + err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await API.put(`/auth/addresses/${id}/default`);
      fetchAddresses();
    } catch (err) {
      alert("Failed to set default: " + err.message);
    }
  };

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <div className="row g-4">
        {/* User Sidebar Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center mb-4">
            <div
              className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: "80px", height: "80px", fontSize: "28px" }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h4 className="fw-bold mb-1">{user?.name}</h4>
            <p className="text-muted small mb-2">{user?.email}</p>
            <div>
              <span className="badge bg-secondary-subtle text-secondary px-3 py-1 rounded-pill text-uppercase">
                {user?.role}
              </span>
            </div>

            <hr className="my-4" />

            <div className="d-flex flex-column gap-2 text-start">
              <Link to="/my-orders" className="btn btn-light text-start rounded-3 d-flex align-items-center gap-2">
                <Package size={17} className="text-primary" /> My Orders & Invoices
              </Link>
              <Link to="/wishlist" className="btn btn-light text-start rounded-3 d-flex align-items-center gap-2">
                <Heart size={17} className="text-danger" /> My Saved Wishlist
              </Link>
              {user?.role === "customer" && (
                <Link to="/vendor/onboarding" className="btn btn-outline-primary text-start rounded-3 d-flex align-items-center gap-2">
                  <ShieldCheck size={17} /> Become a Verified Merchant
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Profile & Address Details */}
        <div className="col-lg-8">
          {/* Profile Details Form */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <User size={19} className="text-primary" /> Personal Information
            </h5>

            {profileMsg && (
              <div
                className={`alert ${profileMsg.startsWith("Error") ? "alert-danger" : "alert-success"} py-2 small`}
              >
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Email Address (Read-only)</label>
                  <input type="email" className="form-control bg-light" value={user?.email || ""} readOnly />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="form-control"
                    value={profileData.country}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Default Street Address</label>
                  <input
                    type="text"
                    name="street"
                    className="form-control"
                    value={profileData.street}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={profileData.city}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">State</label>
                  <input
                    type="text"
                    name="state"
                    className="form-control"
                    value={profileData.state}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    className="form-control"
                    value={profileData.postalCode}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="mt-4 text-end">
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4 text-white d-inline-flex align-items-center gap-2"
                  disabled={savingProfile}
                >
                  <Save size={16} /> {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Saved Address Book */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <MapPin size={19} className="text-primary" /> Saved Delivery Addresses
              </h5>
              <button
                className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1"
                onClick={() => setShowAddAddress(!showAddAddress)}
              >
                <Plus size={15} /> Add New Address
              </button>
            </div>

            {/* Add Address Form toggle */}
            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="card p-3 border-0 bg-light rounded-3 mb-4 shadow-xs">
                <h6 className="fw-bold mb-3">Add Delivery Address</h6>
                <div className="row g-2">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Full Name"
                      value={newAddr.fullName}
                      onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Contact Phone"
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Street Address, House/Apt No."
                      value={newAddr.street}
                      onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="City"
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="State"
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Postal Code"
                      value={newAddr.postalCode}
                      onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowAddAddress(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary text-white" disabled={addingAddr}>
                    {addingAddr ? "Adding..." : "Save Address"}
                  </button>
                </div>
              </form>
            )}

            {/* Address List */}
            {loadingAddresses ? (
              <div className="text-center py-3">
                <span className="spinner-border spinner-border-sm text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <p className="text-muted small mb-0">No saved delivery addresses found. Add one above.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="border rounded-3 p-3 d-flex justify-content-between align-items-start bg-white"
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong>{addr.fullName}</strong>
                        {addr.isDefault && (
                          <span className="badge bg-success-subtle text-success small">Default</span>
                        )}
                      </div>
                      <div className="text-muted small">
                        {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
                      </div>
                      <div className="text-muted small mt-1">Phone: {addr.phone}</div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {!addr.isDefault && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleSetDefault(addr._id)}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteAddress(addr._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
