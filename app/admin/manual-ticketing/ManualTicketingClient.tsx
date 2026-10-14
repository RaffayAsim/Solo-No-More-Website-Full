"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ManualUserOption,
  ManualEventOption,
  adminAssignExistingUserTicketAction,
  adminCreateUserAndAssignTicketAction,
} from "@/app/actions/manual-ticketing";
import {
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Ticket,
  UserPlus,
  Users,
  Calendar,
} from "lucide-react";

interface ManualTicketingClientProps {
  initialUsers: ManualUserOption[];
  initialEvents: ManualEventOption[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   CUSTOM SEARCHABLE DROPDOWN (Matches User's Image 1 & Image 2 exactly)
   ───────────────────────────────────────────────────────────────────────────── */
interface SearchableDropdownProps<T> {
  options: T[];
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  getOptionLabel: (item: T) => string;
  getOptionId: (item: T) => string;
  onSelect: (item: T | null) => void;
  openDirection?: "up" | "down";
}

function SearchableDropdown<T>({
  options,
  value,
  placeholder,
  searchPlaceholder,
  getOptionLabel,
  getOptionId,
  onSelect,
  openDirection = "down",
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = options.find((opt) => getOptionId(opt) === value);
  const displayText = selectedItem ? getOptionLabel(selectedItem) : placeholder;

  const filteredOptions = options.filter((opt) => {
    const label = getOptionLabel(opt).toLowerCase();
    const q = search.toLowerCase().trim();
    return label.includes(q);
  });

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      {/* ── Dropdown Trigger Box ── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: "rgba(18, 12, 24, 0.85)",
          border: isOpen ? "1px solid #FF6F26" : "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "12px",
          color: selectedItem ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)",
          fontSize: "13.5px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          outline: "none",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 15px rgba(255, 111, 38, 0.28)" : "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayText}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-[#FF8A3D] shrink-0 ml-2" />
        ) : (
          <ChevronDown size={16} className="text-white/60 shrink-0 ml-2" />
        )}
      </button>

      {/* ── Floating Popup Menu (Matching Image 1 & 2) ── */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            [openDirection === "up" ? "bottom" : "top"]: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#0D0814",
            border: "1px solid rgba(255, 111, 38, 0.35)",
            borderRadius: "14px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75)",
            padding: "10px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Top Search Input Box */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "10px",
              padding: "8px 12px",
            }}
          >
            <Search size={14} className="text-white/40 mr-2 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#FFFFFF",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              paddingRight: "2px",
            }}
            className="custom-tabs-scrollbar"
          >
            {/* Reset / Default Option */}
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                borderRadius: "8px",
                background: !selectedItem ? "rgba(255, 111, 38, 0.15)" : "transparent",
                color: !selectedItem ? "#FFA05C" : "rgba(255, 255, 255, 0.55)",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              className="hover:bg-white/[0.08]"
            >
              {placeholder}
            </button>

            {/* Filtered Results */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const isSelected = getOptionId(item) === value;
                return (
                  <button
                    key={getOptionId(item)}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      background: isSelected ? "rgba(255, 111, 38, 0.22)" : "transparent",
                      color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.9)",
                      fontSize: "13px",
                      fontWeight: isSelected ? 700 : 500,
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.12s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    className="hover:bg-white/[0.08]"
                  >
                    <span>{getOptionLabel(item)}</span>
                    {isSelected && <span style={{ color: "#FF6F26", fontSize: "11px", fontWeight: 800 }}>✓</span>}
                  </button>
                );
              })
            ) : (
              <div style={{ padding: "12px", fontSize: "12px", color: "rgba(255, 255, 255, 0.4)", textAlign: "center" }}>
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN MANUAL TICKETING WORKSPACE COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */
export default function ManualTicketingClient({
  initialUsers,
  initialEvents,
}: ManualTicketingClientProps) {
  const [mode, setMode] = useState<"existing" | "create">("create");
  const [users, setUsers] = useState<ManualUserOption[]>(initialUsers);
  const [events] = useState<ManualEventOption[]>(initialEvents);

  // Notification state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State: Existing User
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [passType, setPassType] = useState("Single Pass");
  const [ticketStatus, setTicketStatus] = useState<"Confirm" | "Pending">("Confirm");

  // Form State: Create User + Assign (Matches Image 3)
  const [createUsername, setCreateUsername] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createCity, setCreateCity] = useState("Karachi");
  const [createGender, setCreateGender] = useState("");
  const [createRole, setCreateRole] = useState("Subscriber / Member");
  const [createPassword, setCreatePassword] = useState("");
  const [createEventId, setCreateEventId] = useState("");

  // Submit Existing User Ticket Assignment
  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const userObj = users.find((u) => u.id === selectedUserId);
    const eventObj = events.find((e) => e.id === selectedEventId);

    if (!userObj) {
      setErrorMsg("Please select a user from the dropdown.");
      return;
    }
    if (!eventObj) {
      setErrorMsg("Please select an upcoming event.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminAssignExistingUserTicketAction({
        userId: userObj.id,
        userName: userObj.name,
        userEmail: userObj.email,
        userPhone: userObj.phone,
        eventId: eventObj.id,
        eventTitle: eventObj.title,
        eventDate: eventObj.formatted_date,
        passType,
        ticketStatus,
      });

      if (res.success) {
        setSuccessMsg(
          `✓ Ticket assigned successfully to ${userObj.name} for "${eventObj.title}"! Ticket ID: ${res.ticketId}`
        );
        setSelectedUserId("");
        setSelectedEventId("");
      } else {
        setErrorMsg(res.error || "Failed to assign ticket.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Create User and Assign Ticket (Image 3)
  const handleCreateAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!createFullName.trim() || !createEmail.trim()) {
      setErrorMsg("Full Name and Email are required.");
      return;
    }

    const eventObj = events.find((e) => e.id === createEventId);

    setLoading(true);
    try {
      const res = await adminCreateUserAndAssignTicketAction({
        username: createUsername.trim() || createEmail.split("@")[0],
        fullName: createFullName.trim(),
        email: createEmail.trim(),
        phone: createPhone.trim(),
        gender: createGender || "male",
        role: createRole,
        password: createPassword,
        city: createCity || "Karachi",
        eventId: eventObj?.id || "",
        eventTitle: eventObj?.title || "",
        eventDate: eventObj?.formatted_date || "",
        passType: "Single Pass",
      });

      if (res.success) {
        setSuccessMsg(
          `✓ User "${createFullName}" created successfully!` +
            (eventObj && res.qrId ? ` Ticket [${res.qrId}] assigned for "${eventObj.title}".` : "")
        );

        // Prepend new user to dropdown list
        setUsers((prev) => [
          {
            id: res.userId || `user-${Date.now()}`,
            name: createFullName.trim(),
            email: createEmail.trim(),
            phone: createPhone.trim(),
            username: createUsername.trim(),
          },
          ...prev,
        ]);

        // Reset form
        setCreateUsername("");
        setCreateFullName("");
        setCreateEmail("");
        setCreatePhone("");
        setCreatePassword("");
        setCreateEventId("");
      } else {
        setErrorMsg(res.error || "Failed to create user and assign ticket.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── 1. HEADER (Matching Image 3) ────────────────────────────────── */}
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: "clamp(24px, 3.5vw, 32px)",
            fontWeight: 900,
            margin: "0 0 4px",
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
          }}
        >
          Manual Ticketing
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
          Admin workspace
        </p>
      </div>

      {/* ── 2. MODE SWITCHER PILLS (Matching Image 3) ────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Existing User Pill */}
        <button
          type="button"
          onClick={() => {
            setMode("existing");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          style={{
            padding: "9px 22px",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: mode === "existing" ? 800 : 700,
            cursor: "pointer",
            border: mode === "existing" ? "none" : "1px solid rgba(255, 255, 255, 0.12)",
            background: mode === "existing" ? "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)" : "rgba(255, 255, 255, 0.04)",
            color: mode === "existing" ? "#FFFFFF" : "rgba(255, 255, 255, 0.72)",
            boxShadow: mode === "existing" ? "0 4px 18px rgba(255, 111, 38, 0.45)" : "none",
            transition: "all 0.15s ease",
          }}
          className={mode === "existing" ? "" : "hover:text-white hover:bg-white/[0.08]"}
        >
          Existing User
        </button>

        {/* Create User + Assign Pill (Active in Image 3) */}
        <button
          type="button"
          onClick={() => {
            setMode("create");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          style={{
            padding: "9px 22px",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: mode === "create" ? 800 : 700,
            cursor: "pointer",
            border: mode === "create" ? "none" : "1px solid rgba(255, 255, 255, 0.12)",
            background: mode === "create" ? "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)" : "rgba(255, 255, 255, 0.04)",
            color: mode === "create" ? "#FFFFFF" : "rgba(255, 255, 255, 0.72)",
            boxShadow: mode === "create" ? "0 4px 18px rgba(255, 111, 38, 0.45)" : "none",
            transition: "all 0.15s ease",
          }}
          className={mode === "create" ? "" : "hover:text-white hover:bg-white/[0.08]"}
        >
          Create User + Assign
        </button>
      </div>

      {/* ── 3. FEEDBACK ALERTS ─────────────────────────────────────────── */}
      {successMsg && (
        <div
          style={{
            background: "rgba(39, 201, 63, 0.12)",
            border: "1px solid rgba(39, 201, 63, 0.35)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#4ADE80",
            fontSize: "13.5px",
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: "rgba(255, 68, 68, 0.12)",
            border: "1px solid rgba(255, 68, 68, 0.35)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#FF8080",
            fontSize: "13.5px",
            fontWeight: 700,
          }}
        >
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 4. CARD CONTAINER ──────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(18, 12, 24, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "20px",
          padding: "clamp(20px, 3vw, 32px)",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.45)",
        }}
      >
        {/* ── TAB A: CREATE USER + ASSIGN (Matching Image 3) ────────────── */}
        {mode === "create" && (
          <div>
            <div style={{ marginBottom: "22px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF", margin: "0 0 6px" }}>
                Create User and Assign Ticket
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.55)", margin: 0 }}>
                Fill basic details, create user, and assign ticket in one step.
              </p>
            </div>

            <form onSubmit={handleCreateAndAssign} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Row 1: Username & Full Name */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                  className="focus:border-pink-500 transition-colors"
                />

                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                  className="focus:border-pink-500 transition-colors"
                />
              </div>

              {/* Row 2: Email & Phone Number */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                  className="focus:border-pink-500 transition-colors"
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                  className="focus:border-pink-500 transition-colors"
                />
              </div>

              {/* Row 3: City & Select Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                <input
                  type="text"
                  placeholder="City (e.g. Karachi)"
                  value={createCity}
                  onChange={(e) => setCreateCity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                  className="focus:border-pink-500 transition-colors"
                />

                <select
                  value={createGender}
                  onChange={(e) => setCreateGender(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: createGender ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "13.5px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  className="focus:border-pink-500 transition-colors"
                >
                  <option value="" style={{ background: "#110B17", color: "rgba(255, 255, 255, 0.5)" }}>
                    Select gender
                  </option>
                  <option value="male" style={{ background: "#110B17", color: "#FFFFFF" }}>
                    Male
                  </option>
                  <option value="female" style={{ background: "#110B17", color: "#FFFFFF" }}>
                    Female
                  </option>
                  <option value="other" style={{ background: "#110B17", color: "#FFFFFF" }}>
                    Other
                  </option>
                </select>
              </div>

              {/* Row 4: Subscriber / Member role & Password */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  className="focus:border-pink-500 transition-colors"
                >
                  <option value="Subscriber / Member" style={{ background: "#110B17", color: "#FFFFFF" }}>
                    Subscriber / Member
                  </option>
                  <option value="Guest User" style={{ background: "#110B17", color: "#FFFFFF" }}>
                    Guest User
                  </option>
                  <option value="Partner" style={{ background: "#110B17", color: "#FFFFFF" }}>
                    Partner
                  </option>
                  <option value="Admin" style={{ background: "#110B17", color: "#FFFFFF" }}>
                    Admin
                  </option>
                </select>

                <input
                  type="password"
                  placeholder="Password (min 6 chars, optional)"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                  className="focus:border-pink-500 transition-colors"
                />
              </div>

              {/* Row 5: Upcoming Event (Searchable Dropdown matching Image 2) */}
              <div style={{ marginTop: "4px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
                  Upcoming Event
                </label>
                <SearchableDropdown<ManualEventOption>
                  options={events}
                  value={createEventId}
                  placeholder="Select event"
                  searchPlaceholder="Search events..."
                  getOptionId={(evt) => evt.id}
                  getOptionLabel={(evt) => `${evt.title} (${evt.formatted_date})`}
                  onSelect={(item) => setCreateEventId(item ? item.id : "")}
                  openDirection="up"
                />
              </div>

              {/* Submit Button (Matching Image 3) */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 6px 20px rgba(255, 111, 38, 0.45)",
                  transition: "all 0.15s ease",
                }}
                className="hover:brightness-110 active:scale-[0.99]"
              >
                {loading ? "Processing..." : "Create User and Assign Ticket"}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB B: EXISTING USER (Matching Image 1 & Image 2) ──────────── */}
        {mode === "existing" && (
          <div>
            <div style={{ marginBottom: "22px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF", margin: "0 0 6px" }}>
                Assign Ticket to Existing User
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.55)", margin: 0 }}>
                Select an existing registered member or guest user and assign them an event ticket.
              </p>
            </div>

            <form onSubmit={handleAssignExisting} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Field 1: User Searchable Dropdown (Image 1) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
                  Select User
                </label>
                <SearchableDropdown<ManualUserOption>
                  options={users}
                  value={selectedUserId}
                  placeholder="Select user"
                  searchPlaceholder="Search users..."
                  getOptionId={(u) => u.id}
                  getOptionLabel={(u) => `${u.name} (${u.email})`}
                  onSelect={(item) => setSelectedUserId(item ? item.id : "")}
                  openDirection="down"
                />
              </div>

              {/* Field 2: Event Searchable Dropdown (Image 2) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
                  Upcoming Event
                </label>
                <SearchableDropdown<ManualEventOption>
                  options={events}
                  value={selectedEventId}
                  placeholder="Select event"
                  searchPlaceholder="Search events..."
                  getOptionId={(evt) => evt.id}
                  getOptionLabel={(evt) => `${evt.title} (${evt.formatted_date})`}
                  onSelect={(item) => setSelectedEventId(item ? item.id : "")}
                  openDirection="down"
                />
              </div>

              {/* Row 3: Pass Type & Ticket Status */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Pass Type
                  </label>
                  <select
                    value={passType}
                    onChange={(e) => setPassType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(0, 0, 0, 0.45)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13.5px",
                      outline: "none",
                      cursor: "pointer",
                    }}
                    className="focus:border-pink-500 transition-colors"
                  >
                    <option value="Single Pass" style={{ background: "#110B17", color: "#FFFFFF" }}>Single Pass</option>
                    <option value="Couple Pass" style={{ background: "#110B17", color: "#FFFFFF" }}>Couple Pass</option>
                    <option value="VIP Pass" style={{ background: "#110B17", color: "#FFFFFF" }}>VIP Pass</option>
                    <option value="Guest Pass" style={{ background: "#110B17", color: "#FFFFFF" }}>Guest Pass</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", marginBottom: "6px" }}>
                    Ticket Status
                  </label>
                  <select
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value as "Confirm" | "Pending")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(0, 0, 0, 0.45)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "13.5px",
                      outline: "none",
                      cursor: "pointer",
                    }}
                    className="focus:border-pink-500 transition-colors"
                  >
                    <option value="Confirm" style={{ background: "#110B17", color: "#FFFFFF" }}>Confirm (Active)</option>
                    <option value="Pending" style={{ background: "#110B17", color: "#FFFFFF" }}>Pending Review</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "14px 24px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #FF6F26 0%, #FF4400 100%)",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 6px 20px rgba(255, 111, 38, 0.45)",
                  transition: "all 0.15s ease",
                }}
                className="hover:brightness-110 active:scale-[0.99]"
              >
                {loading ? "Processing..." : "Assign Ticket"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
