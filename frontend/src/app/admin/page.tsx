"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Users,
  Plus,
  Lock,
  LogOut,
  RefreshCw,
  Sliders,
  LayoutDashboard,
  Inbox,
  DollarSign,
  CheckSquare,
  Settings,
  Download,
  Phone,
  ExternalLink,
  Printer,
  Truck,
  Building2,
  AlertCircle,
} from "lucide-react";
import RouteGlobe from "@/components/RouteGlobe";

interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  hubLocation: string | null;
  permissions: string[];
  allowedStatuses: string[];
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire de connexion
  const [email, setEmail] = useState("admin@roumtransit.com");
  const [password, setPassword] = useState("AdminRoum2026!");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "requests"
    | "shipments"
    | "clients"
    | "tariffs"
    | "finances"
    | "tasks"
    | "roles"
    | "users"
    | "settings"
  >("dashboard");

  // Données
  const [stats, setStats] = useState<any>(null);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [tariffsList, setTariffsList] = useState<any[]>([]);
  const [routesList, setRoutesList] = useState<any[]>([]);
  const [modesList, setModesList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<Record<string, string>>({});

  // Recherche & filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modales
  const [showCreateShipmentModal, setShowCreateShipmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<any | null>(null);
  const [showPrintLabelModal, setShowPrintLabelModal] = useState<any | null>(null);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<any | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateTariffModal, setShowCreateTariffModal] = useState(false);

  // Formulaires
  const [newShipment, setNewShipment] = useState({
    client_name: "",
    client_phone: "+223",
    client_country: "Mali",
    client_city: "Bamako",
    route_id: "route-cn-ml",
    shipping_mode_id: "AIR_EXPRESS",
    package_label: "Colis Marchandise 1",
    weight_kg: 5,
    description: "Vêtements et accessoires",
  });

  const [statusUpdate, setStatusUpdate] = useState({
    new_status: "RECEIVED_AT_HUB",
    location: "Hub Entrepôt Guangzhou",
    comment: "Pesé et étiqueté pour expédition",
  });

  const [newClient, setNewClient] = useState({
    full_name: "",
    phone_whatsapp: "+223",
    email: "",
    country: "Mali",
    city: "Bamako",
    address: "",
    notes: "",
  });

  const [newPayment, setNewPayment] = useState({
    client_id: "",
    shipment_id: "",
    amount: 100,
    currency: "USD",
    payment_method: "WAVE",
    payment_type: "ADVANCE",
    reference_code: "",
    receipt_notes: "Reçu via paiement mobile",
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
    due_date: "",
  });

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: ["dashboard.view", "shipments.view", "shipments.create", "shipments.status.update"] as string[],
    allowed_statuses: ["RECEIVED_AT_HUB", "PACKED_READY", "IN_TRANSIT"] as string[],
  });

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "SUPER_ADMIN",
    hub_location: "Entrepôt Guangzhou",
  });

  const [newTariff, setNewTariff] = useState({
    route_id: "route-cn-ml",
    shipping_mode_id: "AIR_EXPRESS",
    currency: "USD",
    price_per_unit: 12,
    minimum_charge: 50,
    estimated_days_min: 3,
    estimated_days_max: 7,
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("roum_admin_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }
    fetchSession(savedToken);
  }, []);

  const fetchSession = async (jwtToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(jwtToken);
        loadDashboardData(jwtToken);
      } else {
        localStorage.removeItem("roum_admin_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem("roum_admin_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Identifiants invalides.");
        return;
      }

      localStorage.setItem("roum_admin_token", data.token);
      setToken(data.token);
      setUser(data.user);
      loadDashboardData(data.token);
    } catch {
      setLoginError("Erreur de communication avec le serveur.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("roum_admin_token");
    setToken(null);
    setUser(null);
  };

  const loadDashboardData = async (jwtToken: string) => {
    setIsRefreshing(true);
    const headers = { Authorization: `Bearer ${jwtToken}` };

    try {
      fetch("/api/admin/stats", { headers })
        .then((r) => r.json())
        .then((d) => d.stats && setStats(d.stats))
        .catch(() => {});

      fetch("/api/admin/shipments", { headers })
        .then((r) => r.json())
        .then((d) => d.shipments && setShipments(d.shipments))
        .catch(() => {});

      fetch("/api/admin/requests", { headers })
        .then((r) => r.json())
        .then((d) => d.requests && setRequestsList(d.requests))
        .catch(() => {});

      fetch("/api/admin/clients", { headers })
        .then((r) => r.json())
        .then((d) => d.clients && setClientsList(d.clients))
        .catch(() => {});

      fetch("/api/admin/tariffs", { headers })
        .then((r) => r.json())
        .then((d) => d.tariffs && setTariffsList(d.tariffs))
        .catch(() => {});
      fetch("/api/admin/routes", { headers })
        .then((r) => r.json())
        .then((d) => d.routes && setRoutesList(d.routes))
        .catch(() => {});
      fetch("/api/admin/modes", { headers })
        .then((r) => r.json())
        .then((d) => d.modes && setModesList(d.modes))
        .catch(() => {});

      fetch("/api/admin/payments", { headers })
        .then((r) => r.json())
        .then((d) => d.payments && setPaymentsList(d.payments))
        .catch(() => {});

      fetch("/api/admin/tasks", { headers })
        .then((r) => r.json())
        .then((d) => d.tasks && setTasksList(d.tasks))
        .catch(() => {});

      fetch("/api/admin/roles", { headers })
        .then((r) => r.json())
        .then((d) => d.roles && setRoles(d.roles))
        .catch(() => {});
      fetch("/api/admin/permissions", { headers })
        .then((r) => r.json())
        .then((d) => d.permissions && setAllPermissions(d.permissions))
        .catch(() => {});
      fetch("/api/admin/statuses", { headers })
        .then((r) => r.json())
        .then((d) => d.statuses && setAllStatuses(d.statuses))
        .catch(() => {});
      fetch("/api/admin/users", { headers })
        .then((r) => r.json())
        .then((d) => d.users && setUsersList(d.users))
        .catch(() => {});

      fetch("/api/admin/settings", { headers })
        .then((r) => r.json())
        .then((d) => d.settings && setCompanySettings(d.settings))
        .catch(() => {});
      fetch("/api/admin/audit-logs", { headers })
        .then((r) => r.json())
        .then((d) => d.logs && setAuditLogs(d.logs))
        .catch(() => {});
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client: {
            full_name: newShipment.client_name,
            phone_whatsapp: newShipment.client_phone,
            country: newShipment.client_country,
            city: newShipment.client_city,
          },
          route_id: newShipment.route_id,
          shipping_mode_id: newShipment.shipping_mode_id,
          parcels: [
            {
              package_label: newShipment.package_label,
              weight_kg: Number(newShipment.weight_kg),
              description: newShipment.description,
            },
          ],
        }),
      });

      if (res.ok) {
        setShowCreateShipmentModal(false);
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de la création.");
      }
    } catch {
      alert("Erreur de communication avec le serveur.");
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !showStatusModal) return;

    try {
      const res = await fetch(`/api/admin/shipments/${showStatusModal.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statusUpdate),
      });

      if (res.ok) {
        setShowStatusModal(null);
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Mise à jour impossible.");
      }
    } catch {
      alert("Erreur de communication avec le serveur.");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPayment.client_id) return;

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: newPayment.client_id,
          shipment_id: newPayment.shipment_id || undefined,
          amount_minor: Math.round(Number(newPayment.amount) * 100),
          currency: newPayment.currency,
          payment_method: newPayment.payment_method,
          payment_type: newPayment.payment_type,
          reference_code: newPayment.reference_code || undefined,
          receipt_notes: newPayment.receipt_notes || undefined,
        }),
      });

      if (res.ok) {
        setShowRecordPaymentModal(null);
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de l'enregistrement du paiement.");
      }
    } catch {
      alert("Erreur de communication avec le serveur.");
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
      });

      if (res.ok) {
        setShowCreateClientModal(false);
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de la création du client.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      if (res.ok) {
        setShowCreateTaskModal(false);
        setNewTask({ title: "", description: "", category: "GENERAL", priority: "MEDIUM", due_date: "" });
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de la création de la tâche.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!token) return;
    const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";

    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadDashboardData(token);
      }
    } catch {
      alert("Impossible de changer le statut.");
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRole),
      });

      if (res.ok) {
        setShowCreateRoleModal(false);
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de la création du rôle.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        setShowCreateUserModal(false);
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de la création de l'utilisateur.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleCreateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("/api/admin/tariffs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          route_id: newTariff.route_id,
          shipping_mode_id: newTariff.shipping_mode_id,
          currency: newTariff.currency,
          price_per_unit_minor: Math.round(Number(newTariff.price_per_unit) * 100),
          minimum_charge_minor: Math.round(Number(newTariff.minimum_charge) * 100),
          estimated_days_min: Number(newTariff.estimated_days_min),
          estimated_days_max: Number(newTariff.estimated_days_max),
        }),
      });

      if (res.ok) {
        setShowCreateTariffModal(false);
        loadDashboardData(token);
      } else {
        const d = await res.json();
        alert(d.error || "Erreur de tarification.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadDashboardData(token);
      }
    } catch {
      alert("Erreur lors de la mise à jour.");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)" }}>
        <RefreshCw size={28} className="spin" color="var(--brown-dark)" />
      </div>
    );
  }

  // ÉCRAN 1 : CONNEXION SOBRE & ÉPURÉE
  if (!token || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--bg-app)",
        }}
      >
        <div
          className="card-clean"
          style={{
            maxWidth: "400px",
            width: "100%",
            padding: "36px 32px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-sm)",
                background: "var(--brown-dark)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FAF8F5",
                fontWeight: "800",
                fontSize: "1.2rem",
                marginBottom: "14px",
              }}
            >
              RT
            </div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "4px" }}>
              ROUM TRANSIT
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Panneau d&apos;administration réservé au personnel.
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--state-danger-bg)",
                border: "1px solid var(--state-danger-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--state-danger-text)",
                fontSize: "0.82rem",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                Identifiant / Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-clean"
                placeholder="admin@roumtransit.com"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: "600" }}>
                Mot de Passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-clean"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px", marginTop: "6px" }}
            >
              {loginLoading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Se Connecter
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-light)",
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--text-dim)",
            }}
          >
            Session sécurisée par jeton chiffré & contrôle d&apos;accès temps réel.
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN 2 : INTERFACE SOBRE, MINIMALISTE ET ÉLÉGANTE DU DASHBOARD
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
      {/* SIDEBAR DISCRÈTE */}
      <aside
        style={{
          width: "250px",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-light)",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Marque */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 8px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-sm)",
              background: "var(--brown-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FAF8F5",
              fontWeight: "800",
              fontSize: "1rem",
            }}
          >
            RT
          </div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "0.98rem", color: "var(--text-main)", lineHeight: "1.1" }}>
              ROUM TRANSIT
            </div>
            <div style={{ fontSize: "0.64rem", fontWeight: "700", color: "var(--brown-light)", letterSpacing: "0.08em" }}>
              GESTION INTERNE
            </div>
          </div>
        </div>

        {/* Profil Collaborateur */}
        <div
          style={{
            padding: "10px 12px",
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-main)" }}>
            {user.fullName}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--brown-light)", marginTop: "1px" }}>
            {user.roleName} {user.isSuperAdmin && "(Super Admin)"}
          </div>
          {user.hubLocation && (
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "3px" }}>
              {user.hubLocation}
            </div>
          )}
        </div>

        {/* Navigation Sidebar */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "dashboard" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "dashboard" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "dashboard" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.86rem",
              borderLeft: activeTab === "dashboard" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <LayoutDashboard size={16} />
            Tableau de Bord
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "requests" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "requests" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "requests" ? "700" : "500",
              cursor: "pointer",
              fontSize: "0.86rem",
              borderLeft: activeTab === "requests" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <Inbox size={16} />
              Demandes reçues
            </span>
            {stats?.pending_requests > 0 && (
              <span
                style={{
                  background: "var(--brown-dark)",
                  color: "#FAF8F5",
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: "700",
                }}
              >
                {stats.pending_requests}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shipments")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "shipments" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "shipments" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "shipments" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.86rem",
              borderLeft: activeTab === "shipments" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <Package size={16} />
            Expéditions & Colis
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "clients" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "clients" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "clients" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.86rem",
              borderLeft: activeTab === "clients" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <Users size={16} />
            Clients
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tariffs")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "tariffs" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "tariffs" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "tariffs" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.86rem",
              borderLeft: activeTab === "tariffs" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <Truck size={16} />
            Tarifs & Routes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finances")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "finances" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "finances" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "finances" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.86rem",
              borderLeft: activeTab === "finances" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <DollarSign size={16} />
            Finances & Paiements
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "tasks" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "tasks" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "tasks" ? "700" : "500",
              cursor: "pointer",
              fontSize: "0.86rem",
              borderLeft: activeTab === "tasks" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <CheckSquare size={16} />
              Tâches
            </span>
            {stats?.pending_tasks > 0 && (
              <span
                style={{
                  background: "var(--bg-subtle)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-light)",
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: "700",
                }}
              >
                {stats.pending_tasks}
              </span>
            )}
          </button>

          {user.isSuperAdmin && (
            <>
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  padding: "14px 12px 4px 12px",
                  letterSpacing: "0.06em",
                }}
              >
                Système
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("roles")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: activeTab === "roles" ? "var(--bg-subtle)" : "transparent",
                  color: activeTab === "roles" ? "var(--brown-dark)" : "var(--text-secondary)",
                  fontWeight: activeTab === "roles" ? "700" : "500",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.86rem",
                  borderLeft: activeTab === "roles" ? "3px solid var(--brown-dark)" : "3px solid transparent",
                }}
              >
                <Sliders size={16} />
                Rôles & Droits
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: activeTab === "users" ? "var(--bg-subtle)" : "transparent",
                  color: activeTab === "users" ? "var(--brown-dark)" : "var(--text-secondary)",
                  fontWeight: activeTab === "users" ? "700" : "500",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.86rem",
                  borderLeft: activeTab === "users" ? "3px solid var(--brown-dark)" : "3px solid transparent",
                }}
              >
                <Building2 size={16} />
                Collaborateurs
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "settings" ? "var(--bg-subtle)" : "transparent",
              color: activeTab === "settings" ? "var(--brown-dark)" : "var(--text-secondary)",
              fontWeight: activeTab === "settings" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.86rem",
              marginTop: "auto",
              borderLeft: activeTab === "settings" ? "3px solid var(--brown-dark)" : "3px solid transparent",
            }}
          >
            <Settings size={16} />
            Paramètres & Audit
          </button>
        </nav>

        {/* Bouton Déconnexion discret */}
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center", gap: "6px", fontSize: "0.82rem", padding: "8px" }}
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </aside>

      {/* ZONE CENTRALE DE TRAVAIL ÉPURÉE */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {/* En-tête de page sobre */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--text-main)" }}>
              {activeTab === "dashboard" && "Tableau de Bord"}
              {activeTab === "requests" && "Demandes & Sourcing"}
              {activeTab === "shipments" && "Expéditions & Colis"}
              {activeTab === "clients" && "Répertoire Clients"}
              {activeTab === "tariffs" && "Grilles Tarifaires"}
              {activeTab === "finances" && "Paiements & Encaissements"}
              {activeTab === "tasks" && "Tâches Opérationnelles"}
              {activeTab === "roles" && "Rôles Dynamiques (RBAC)"}
              {activeTab === "users" && "Comptes Collaborateurs"}
              {activeTab === "settings" && "Paramètres & Audit"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "2px" }}>
              ROUM TRANSIT · Administration générale
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => token && loadDashboardData(token)}
              className="btn btn-secondary"
              style={{ padding: "8px 12px" }}
              title="Actualiser"
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
            </button>

            {activeTab === "shipments" && (
              <>
                <a
                  href="/api/admin/exports/shipments.csv"
                  className="btn btn-secondary"
                  style={{ padding: "8px 14px", fontSize: "0.82rem", gap: "6px" }}
                >
                  <Download size={14} />
                  Export CSV
                </a>
                <button
                  type="button"
                  onClick={() => setShowCreateShipmentModal(true)}
                  className="btn btn-primary"
                  style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
                >
                  <Plus size={14} />
                  Nouvelle Expédition
                </button>
              </>
            )}

            {activeTab === "clients" && (
              <button
                type="button"
                onClick={() => setShowCreateClientModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Nouveau Client
              </button>
            )}

            {activeTab === "finances" && (
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal({})}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Consigner Paiement
              </button>
            )}

            {activeTab === "tasks" && (
              <button
                type="button"
                onClick={() => setShowCreateTaskModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Nouvelle Tâche
              </button>
            )}

            {activeTab === "tariffs" && (
              <button
                type="button"
                onClick={() => setShowCreateTariffModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Nouveau Tarif
              </button>
            )}

            {activeTab === "roles" && (
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Créer un Rôle
              </button>
            )}

            {activeTab === "users" && (
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem", gap: "6px" }}
              >
                <Plus size={14} />
                Nouveau Compte
              </button>
            )}
          </div>
        </div>

        {/* 1. TABLEAU DE BORD : STATS SOBRES EN UN SEUL DIV (Audio 2) & GLOBE 3D AVEC PAYS RÉELS (Audio 1) */}
        {activeTab === "dashboard" && (
          <div>
            {/* BARRE KPI UNIFIÉE DANS UN SEUL DIV AVEC SÉPARATEURS PAR LIGNES */}
            <div className="kpi-unified-bar" style={{ marginBottom: "24px" }}>
              <div className="kpi-item">
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Expéditions en cours
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.1" }}>
                  {stats?.active_shipments || 0}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--brown-light)", marginTop: "3px" }}>
                  Sur {stats?.total_shipments || 0} dossiers totaux
                </div>
              </div>

              <div className="kpi-item">
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Demandes reçues
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--brown-dark)", lineHeight: "1.1" }}>
                  {stats?.pending_requests || 0}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "3px" }}>
                  Alibaba & transit à qualifier
                </div>
              </div>

              <div className="kpi-item">
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Colis Livrés
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--state-success-text)", lineHeight: "1.1" }}>
                  {stats?.delivered_shipments || shipments.filter((s) => s.current_status === "DELIVERED").length || 0}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "3px" }}>
                  Zéro perte ni litige
                </div>
              </div>

              <div className="kpi-item">
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Clients enregistrés
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.1" }}>
                  {stats?.total_clients || 0}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "3px" }}>
                  Répertoire vérifié
                </div>
              </div>

              <div className="kpi-item">
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Total Encaissé
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--brown-dark)", lineHeight: "1.1" }}>
                  ${((stats?.total_payments_minor || 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--state-success-text)", marginTop: "3px" }}>
                  En caisse / mobile money
                </div>
              </div>
            </div>

            {/* GLOBE 3D INTERACTIF DES EXPÉDITIONS (Demande explicite Audio 1) */}
            <div style={{ marginBottom: "24px" }}>
              <RouteGlobe shipments={shipments} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "18px" }}>
              <div className="card-clean" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "0.98rem" }}>Dernières Expéditions</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("shipments")}
                    style={{ background: "none", border: "none", color: "var(--brown-light)", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                  >
                    Voir tout →
                  </button>
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {shipments.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong style={{ color: "var(--brown-dark)", fontSize: "0.88rem" }}>{s.tracking_number}</strong>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {s.client_name} · {s.origin_country} → {s.destination_country}
                        </div>
                      </div>
                      <span className="badge-clean badge-transit">
                        {s.status_label || s.current_status}
                      </span>
                    </div>
                  ))}
                  {shipments.length === 0 && (
                    <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "16px 0", textAlign: "center" }}>
                      Aucune expédition enregistrée.
                    </div>
                  )}
                </div>
              </div>

              <div className="card-clean" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "0.98rem" }}>Tâches Prioritaires</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tasks")}
                    style={{ background: "none", border: "none", color: "var(--brown-light)", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                  >
                    Gérer ({tasksList.length}) →
                  </button>
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {tasksList.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={t.status === "DONE"}
                        onChange={() => handleToggleTaskStatus(t.id, t.status)}
                        style={{ cursor: "pointer", accentColor: "var(--brown-dark)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.84rem", textDecoration: t.status === "DONE" ? "line-through" : "none", color: "var(--text-main)" }}>
                          {t.title}
                        </div>
                        {t.due_date && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Échéance : {t.due_date}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: t.priority === "URGENT" ? "var(--state-danger-bg)" : "var(--bg-subtle)",
                          color: t.priority === "URGENT" ? "var(--state-danger-text)" : "var(--text-secondary)",
                          border: `1px solid ${t.priority === "URGENT" ? "var(--state-danger-border)" : "var(--border-light)"}`,
                        }}
                      >
                        {t.priority}
                      </span>
                    </div>
                  ))}
                  {tasksList.length === 0 && (
                    <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", textAlign: "center", padding: "16px 0" }}>
                      Toutes les tâches sont terminées.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DEMANDES REÇUES */}
        {activeTab === "requests" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Rechercher par référence, client, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean"
                style={{ maxWidth: "380px" }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Référence</th>
                    <th style={{ padding: "10px 12px" }}>Type</th>
                    <th style={{ padding: "10px 12px" }}>Client</th>
                    <th style={{ padding: "10px 12px" }}>Trajet</th>
                    <th style={{ padding: "10px 12px" }}>Poids/Infos</th>
                    <th style={{ padding: "10px 12px" }}>Statut</th>
                    <th style={{ padding: "10px 12px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsList
                    .filter((r) =>
                      !searchTerm ||
                      r.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.client_phone?.includes(searchTerm)
                    )
                    .map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "var(--brown-dark)" }}>
                          {r.reference}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className="badge-clean badge-draft">
                            {r.request_type === "ALIBABA" ? "Achat Alibaba" : r.request_type}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{r.client_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.client_phone}</div>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {r.origin_country || "Chine"} → {r.destination_country || "Afrique"}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {r.estimated_weight_kg ? `${r.estimated_weight_kg} kg` : "—"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateRequestStatus(r.id, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-light)",
                              background: "#FFFFFF",
                              color: "var(--text-main)",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            <option value="NEW">NOUVEAU</option>
                            <option value="IN_REVIEW">EN COURS</option>
                            <option value="QUOTE_SENT">DEVIS ENVOYÉ</option>
                            <option value="CONVERTED">CONVERTI EN COLIS</option>
                            <option value="CLOSED">CLÔTURÉ</option>
                            <option value="CANCELLED">ANNULÉ</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <a
                            href={`https://wa.me/${r.client_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Bonjour ${r.client_name}, concernant votre demande ${r.reference} chez ROUM TRANSIT :`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "0.76rem", gap: "4px" }}
                          >
                            <Phone size={12} color="#25D366" /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  {requestsList.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                        Aucune demande client reçue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. EXPÉDITIONS & COLIS */}
        {activeTab === "shipments" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Rechercher par n° suivi, client, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-clean"
                  style={{ maxWidth: "320px" }}
                />

                {/* SÉLECTEUR EN PILLS SOBRE & ÉPURÉ (Demande Audio 2) */}
                <div className="pill-selector">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("")}
                    className={`pill-option ${statusFilter === "" ? "pill-option-active" : ""}`}
                  >
                    Tous ({shipments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("IN_TRANSIT")}
                    className={`pill-option ${statusFilter === "IN_TRANSIT" ? "pill-option-active" : ""}`}
                  >
                    En transit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("DELIVERED")}
                    className={`pill-option ${statusFilter === "DELIVERED" ? "pill-option-active" : ""}`}
                  >
                    Livrés
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("RECEIVED_AT_HUB")}
                    className={`pill-option ${statusFilter === "RECEIVED_AT_HUB" ? "pill-option-active" : ""}`}
                  >
                    Au Hub
                  </button>
                </div>
              </div>

              {allStatuses.length > 0 && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-clean"
                  style={{ maxWidth: "180px", fontSize: "0.8rem", padding: "6px 10px" }}
                >
                  <option value="">Filtre précis...</option>
                  {allStatuses.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.label_public}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>N° Suivi</th>
                    <th style={{ padding: "10px 12px" }}>Client</th>
                    <th style={{ padding: "10px 12px" }}>Liaison</th>
                    <th style={{ padding: "10px 12px" }}>Mode</th>
                    <th style={{ padding: "10px 12px" }}>Colis / Poids</th>
                    <th style={{ padding: "10px 12px" }}>Statut</th>
                    <th style={{ padding: "10px 12px" }}>Paiement</th>
                    <th style={{ padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments
                    .filter((s) => {
                      if (statusFilter && s.current_status !== statusFilter) return false;
                      if (searchTerm) {
                        const term = searchTerm.toLowerCase();
                        return (
                          s.tracking_number.toLowerCase().includes(term) ||
                          s.client_name.toLowerCase().includes(term) ||
                          s.client_phone.includes(term)
                        );
                      }
                      return true;
                    })
                    .map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px" }}>
                          <Link
                            href={`/tracking/${s.tracking_number}`}
                            target="_blank"
                            style={{ fontWeight: "700", color: "var(--brown-dark)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {s.tracking_number}
                            <ExternalLink size={11} />
                          </Link>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {new Date(s.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{s.client_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.client_phone}</div>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {s.origin_country} → {s.destination_country}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {s.shipping_mode_name}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div>{s.total_parcels_count} colis</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.total_weight_kg} kg</div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className="badge-clean badge-transit">
                            {s.status_label || s.current_status}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className={`badge-clean ${s.payment_status === "PAID" ? "badge-delivered" : "badge-draft"}`}>
                            {s.payment_status}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => setShowStatusModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            >
                              Statut
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPrintLabelModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Bordereau"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {shipments.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                        Aucune expédition enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. RÉPERTOIRE DES CLIENTS */}
        {activeTab === "clients" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean"
                style={{ maxWidth: "380px" }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Nom du Client</th>
                    <th style={{ padding: "10px 12px" }}>WhatsApp / Téléphone</th>
                    <th style={{ padding: "10px 12px" }}>Email</th>
                    <th style={{ padding: "10px 12px" }}>Localisation</th>
                    <th style={{ padding: "10px 12px" }}>Dossiers</th>
                    <th style={{ padding: "10px 12px" }}>Contact Direct</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsList
                    .filter((c) =>
                      !searchTerm ||
                      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.phone_whatsapp?.includes(searchTerm) ||
                      c.country?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "var(--text-main)" }}>
                          {c.full_name}
                        </td>
                        <td style={{ padding: "12px", color: "var(--brown-dark)", fontWeight: "600" }}>
                          {c.phone_whatsapp}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                          {c.email || "—"}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {c.city ? `${c.city}, ` : ""}{c.country}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontWeight: "600", color: "var(--text-secondary)" }}>
                            {c.shipments_count || 0} expédition(s)
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <a
                            href={`https://wa.me/${c.phone_whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Bonjour ${c.full_name}, nous vous contactons depuis ROUM TRANSIT :`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "0.76rem", gap: "4px" }}
                          >
                            <Phone size={12} color="#25D366" /> Discuter
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. TARIFS & ROUTES */}
        {activeTab === "tariffs" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "14px" }}>Grilles Tarifaires Actives</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Liaison</th>
                    <th style={{ padding: "10px 12px" }}>Mode</th>
                    <th style={{ padding: "10px 12px" }}>Prix Unitaire</th>
                    <th style={{ padding: "10px 12px" }}>Base</th>
                    <th style={{ padding: "10px 12px" }}>Min. Facturé</th>
                    <th style={{ padding: "10px 12px" }}>Délais Indicatifs</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffsList.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px", fontWeight: "700", color: "var(--text-main)" }}>
                        {t.origin_city ? `${t.origin_city} (${t.origin_country})` : t.origin_country} →{" "}
                        {t.destination_city ? `${t.destination_city} (${t.destination_country})` : t.destination_country}
                      </td>
                      <td style={{ padding: "12px", color: "var(--brown-dark)", fontWeight: "600" }}>
                        {t.shipping_mode_name}
                      </td>
                      <td style={{ padding: "12px", fontWeight: "700", color: "var(--state-success-text)" }}>
                        ${(t.price_per_unit_minor / 100).toFixed(2)} / {t.pricing_basis === "PER_KG" ? "kg" : "m³"}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                        {t.pricing_basis}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                        ${(t.minimum_charge_minor / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                        {t.estimated_days_min} à {t.estimated_days_max} jours ouvrés
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. FINANCES & PAIEMENTS */}
        {activeTab === "finances" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.05rem" }}>Journal des Paiements</h3>
              <div style={{ fontSize: "0.88rem", color: "var(--state-success-text)", fontWeight: "700" }}>
                Total : ${((stats?.total_payments_minor || 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Client</th>
                    <th style={{ padding: "10px 12px" }}>Dossier</th>
                    <th style={{ padding: "10px 12px" }}>Montant</th>
                    <th style={{ padding: "10px 12px" }}>Méthode</th>
                    <th style={{ padding: "10px 12px" }}>Type</th>
                    <th style={{ padding: "10px 12px" }}>Réf Transaction</th>
                    <th style={{ padding: "10px 12px" }}>Opérateur</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                        {new Date(p.recorded_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td style={{ padding: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                        {p.client_name}
                      </td>
                      <td style={{ padding: "12px", color: "var(--brown-dark)", fontWeight: "600" }}>
                        {p.tracking_number || "—"}
                      </td>
                      <td style={{ padding: "12px", fontWeight: "800", color: "var(--state-success-text)" }}>
                        ${(p.amount_minor / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge-clean badge-draft">
                          {p.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                        {p.payment_type}
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {p.reference_code || "Manuel"}
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                        {p.recorded_by_name}
                      </td>
                    </tr>
                  ))}
                  {paymentsList.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                        Aucun paiement consigné.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. TÂCHES D'ÉQUIPE */}
        {activeTab === "tasks" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <div style={{ display: "grid", gap: "10px" }}>
              {tasksList.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: "12px 16px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="checkbox"
                      checked={t.status === "DONE"}
                      onChange={() => handleToggleTaskStatus(t.id, t.status)}
                      style={{ cursor: "pointer", accentColor: "var(--brown-dark)" }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          color: t.status === "DONE" ? "var(--text-dim)" : "var(--text-main)",
                          textDecoration: t.status === "DONE" ? "line-through" : "none",
                        }}
                      >
                        {t.title}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {t.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "10px", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        <span>Catégorie : {t.category}</span>
                        {t.due_date && <span>Échéance : {t.due_date}</span>}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: t.priority === "URGENT" ? "var(--state-danger-bg)" : "var(--bg-subtle)",
                      color: t.priority === "URGENT" ? "var(--state-danger-text)" : "var(--text-secondary)",
                      border: `1px solid ${t.priority === "URGENT" ? "var(--state-danger-border)" : "var(--border-light)"}`,
                    }}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
              {tasksList.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                  Aucune tâche en attente.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. RÔLES DYNAMIQUES */}
        {activeTab === "roles" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <div style={{ display: "grid", gap: "14px" }}>
              {roles.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "16px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.96rem", color: "var(--brown-dark)" }}>{r.name}</strong>
                      {r.is_system === 1 && (
                        <span style={{ fontSize: "0.68rem", padding: "1px 6px", borderRadius: "4px", background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                          Système
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {r.users_count || 0} collaborateur(s)
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "10px" }}>
                    {r.description || "Aucune description."}
                  </p>

                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {r.id === "SUPER_ADMIN" ? (
                      <span style={{ fontWeight: "700", color: "var(--state-success-text)" }}>Accès total sans restriction (*)</span>
                    ) : (
                      r.permissions?.map((p: string) => (
                        <span key={p} style={{ background: "#FFFFFF", border: "1px solid var(--border-light)", padding: "2px 6px", borderRadius: "3px" }}>
                          {p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. COLLABORATEURS */}
        {activeTab === "users" && (
          <div className="card-clean" style={{ padding: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px 12px" }}>Nom</th>
                    <th style={{ padding: "10px 12px" }}>Email</th>
                    <th style={{ padding: "10px 12px" }}>Rôle</th>
                    <th style={{ padding: "10px 12px" }}>Hub</th>
                    <th style={{ padding: "10px 12px" }}>Statut</th>
                    <th style={{ padding: "10px 12px" }}>Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px", fontWeight: "700", color: "var(--text-main)" }}>
                        {u.full_name}
                      </td>
                      <td style={{ padding: "12px", color: "var(--brown-dark)" }}>
                        {u.email}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge-clean badge-draft">{u.role_name}</span>
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                        {u.hub_location || "—"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className={`badge-clean ${u.is_active === 1 ? "badge-delivered" : "badge-incident"}`}>
                          {u.is_active === 1 ? "ACTIF" : "DÉSACTIVÉ"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 10. PARAMÈTRES & AUDIT */}
        {activeTab === "settings" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div className="card-clean" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "14px" }}>Paramètres Opérationnels</h3>
              <div style={{ display: "grid", gap: "12px", maxWidth: "550px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: "600" }}>
                    Nom Entreprise
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_name || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: "600" }}>
                    Adresse Entrepôt Guangzhou
                  </label>
                  <textarea
                    rows={2}
                    value={companySettings.warehouse_china_address || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, warehouse_china_address: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: "600" }}>
                    Shipping Mark Modèle
                  </label>
                  <input
                    type="text"
                    value={companySettings.warehouse_china_shipping_mark || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, warehouse_china_shipping_mark: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: "600" }}>
                    Numéro WhatsApp Officiel
                  </label>
                  <input
                    type="text"
                    value={companySettings.whatsapp_official_number || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, whatsapp_official_number: e.target.value })}
                    className="input-clean"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!token) return;
                    await fetch("/api/admin/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify(companySettings),
                    });
                    alert("Paramètres enregistrés.");
                  }}
                  className="btn btn-primary"
                  style={{ width: "fit-content", padding: "8px 18px", marginTop: "4px" }}
                >
                  Enregistrer Paramètres
                </button>
              </div>
            </div>

            <div className="card-clean" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "14px" }}>Journal d&apos;Audit</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "8px 10px" }}>Date</th>
                      <th style={{ padding: "8px 10px" }}>Auteur</th>
                      <th style={{ padding: "8px 10px" }}>Action</th>
                      <th style={{ padding: "8px 10px" }}>Entité</th>
                      <th style={{ padding: "8px 10px" }}>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((l) => (
                      <tr key={l.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px", color: "var(--text-muted)" }}>
                          {new Date(l.created_at).toLocaleString("fr-FR")}
                        </td>
                        <td style={{ padding: "10px", fontWeight: "600" }}>{l.user_name || "Système"}</td>
                        <td style={{ padding: "10px", color: "var(--brown-dark)", fontWeight: "600" }}>{l.action}</td>
                        <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{l.entity_type}</td>
                        <td style={{ padding: "10px", color: "var(--text-muted)" }}>{l.details_json || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALES SOBRES ET MINIMALISTES */}
      {showCreateShipmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "560px", width: "100%", padding: "28px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "16px" }}>Nouvelle Expédition</h3>
            <form onSubmit={handleCreateShipment} style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Nom Client</label>
                  <input type="text" required value={newShipment.client_name} onChange={(e) => setNewShipment({ ...newShipment, client_name: e.target.value })} className="input-clean" placeholder="Moussa Traoré" />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Téléphone WhatsApp</label>
                  <input type="text" required value={newShipment.client_phone} onChange={(e) => setNewShipment({ ...newShipment, client_phone: e.target.value })} className="input-clean" placeholder="+22370000000" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Liaison</label>
                  <select value={newShipment.route_id} onChange={(e) => setNewShipment({ ...newShipment, route_id: e.target.value })} className="input-clean">
                    {routesList.map((r) => (
                      <option key={r.id} value={r.id}>{r.origin_country} → {r.destination_country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Mode</label>
                  <select value={newShipment.shipping_mode_id} onChange={(e) => setNewShipment({ ...newShipment, shipping_mode_id: e.target.value })} className="input-clean">
                    {modesList.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Libellé Colis</label>
                  <input type="text" value={newShipment.package_label} onChange={(e) => setNewShipment({ ...newShipment, package_label: e.target.value })} className="input-clean" />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Poids (kg)</label>
                  <input type="number" step="0.1" min="0.1" required value={newShipment.weight_kg} onChange={(e) => setNewShipment({ ...newShipment, weight_kg: Number(e.target.value) })} className="input-clean" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Description</label>
                <input type="text" value={newShipment.description} onChange={(e) => setNewShipment({ ...newShipment, description: e.target.value })} className="input-clean" placeholder="Vêtements, pièces auto..." />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateShipmentModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Créer Expédition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CHANGEMENT STATUT */}
      {showStatusModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "6px" }}>Mise à jour : {showStatusModal.tracking_number}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "14px" }}>
              Statut actuel : <strong style={{ color: "var(--brown-dark)" }}>{showStatusModal.status_label || showStatusModal.current_status}</strong>
            </p>

            <form onSubmit={handleUpdateStatus} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Nouveau Statut</label>
                <select value={statusUpdate.new_status} onChange={(e) => setStatusUpdate({ ...statusUpdate, new_status: e.target.value })} className="input-clean">
                  {allStatuses
                    .filter((st) => user.isSuperAdmin || user.allowedStatuses.includes("*") || user.allowedStatuses.includes(st.code))
                    .map((st) => (
                      <option key={st.code} value={st.code}>{st.label_public} ({st.code})</option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Lieu Actuel</label>
                <input type="text" required value={statusUpdate.location} onChange={(e) => setStatusUpdate({ ...statusUpdate, location: e.target.value })} className="input-clean" />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Commentaire Client (Optionnel)</label>
                <input type="text" value={statusUpdate.comment} onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })} className="input-clean" />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowStatusModal(null)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer Statut</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : IMPRESSION BORDEREAU */}
      {showPrintLabelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "480px", width: "100%", padding: "30px", background: "#FFFFFF", color: "#1C1815" }}>
            <div style={{ borderBottom: "1px solid #E8E2D8", paddingBottom: "10px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "800", fontSize: "1.15rem" }}>ROUM TRANSIT</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>BORDEREAU D&apos;EXPÉDITION</div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "14px", borderRadius: "var(--radius-sm)", marginBottom: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "2px" }}>NUMÉRO DE SUIVI</div>
              <div style={{ fontSize: "1.45rem", fontWeight: "800", letterSpacing: "1px", color: "var(--brown-dark)" }}>
                {showPrintLabelModal.tracking_number}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.82rem", marginBottom: "14px" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>DESTINATAIRE</span>
                <strong>{showPrintLabelModal.client_name}</strong>
                <div>{showPrintLabelModal.client_phone}</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>LIAISON</span>
                <strong>{showPrintLabelModal.origin_country} → {showPrintLabelModal.destination_country}</strong>
                <div>{showPrintLabelModal.shipping_mode_name}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.82rem", borderTop: "1px dashed #E8E2D8", paddingTop: "10px", marginBottom: "18px" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>POIDS BRUT</span>
                <strong>{showPrintLabelModal.total_weight_kg} KG</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>COLIS</span>
                <strong>{showPrintLabelModal.total_parcels_count} COLIS</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowPrintLabelModal(null)} className="btn btn-secondary">Fermer</button>
              <button type="button" onClick={() => window.print()} className="btn btn-primary">Imprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : NOUVEAU CLIENT */}
      {showCreateClientModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Nouveau Client</h3>
            <form onSubmit={handleCreateClient} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Nom Complet</label>
                <input type="text" required value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} className="input-clean" placeholder="Awa Diarra" />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>WhatsApp / Téléphone</label>
                <input type="text" required value={newClient.phone_whatsapp} onChange={(e) => setNewClient({ ...newClient, phone_whatsapp: e.target.value })} className="input-clean" placeholder="+22370000000" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Pays</label>
                  <input type="text" required value={newClient.country} onChange={(e) => setNewClient({ ...newClient, country: e.target.value })} className="input-clean" placeholder="Mali" />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Ville</label>
                  <input type="text" value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} className="input-clean" placeholder="Bamako" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateClientModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CONSIGNER PAIEMENT */}
      {showRecordPaymentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Consigner un Paiement</h3>
            <form onSubmit={handleRecordPayment} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Client</label>
                <select required value={newPayment.client_id} onChange={(e) => setNewPayment({ ...newPayment, client_id: e.target.value })} className="input-clean">
                  <option value="">Sélectionner un client</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.phone_whatsapp})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Montant ($)</label>
                  <input type="number" min="1" step="0.01" required value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })} className="input-clean" />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Méthode</label>
                  <select value={newPayment.payment_method} onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })} className="input-clean">
                    <option value="WAVE">Wave</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="CASH">Espèces</option>
                    <option value="BANK_TRANSFER">Virement Bancaire</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Réf Transaction</label>
                <input type="text" value={newPayment.reference_code} onChange={(e) => setNewPayment({ ...newPayment, reference_code: e.target.value })} className="input-clean" placeholder="TXN-12345" />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowRecordPaymentModal(null)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer Paiement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : NOUVELLE TÂCHE */}
      {showCreateTaskModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Nouvelle Tâche</h3>
            <form onSubmit={handleCreateTask} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Titre</label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="input-clean" placeholder="Vérifier colis entrepôt..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Priorité</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="input-clean">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Normale</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Échéance</label>
                  <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="input-clean" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Créer Tâche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CRÉATION RÔLE */}
      {showCreateRoleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "560px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Créer un Rôle Dynamique</h3>
            <form onSubmit={handleCreateRole} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Nom du Rôle</label>
                <input type="text" required value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} className="input-clean" placeholder="Ex: Agent Guangzhou" />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Description</label>
                <input type="text" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} className="input-clean" />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: "600" }}>Permissions</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", maxHeight: "150px", overflowY: "auto", padding: "8px", background: "var(--bg-app)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)" }}>
                  {allPermissions.map((p) => (
                    <label key={p.code} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(p.code)}
                        onChange={(e) => {
                          if (e.target.checked) setNewRole({ ...newRole, permissions: [...newRole.permissions, p.code] });
                          else setNewRole({ ...newRole, permissions: newRole.permissions.filter((c) => c !== p.code) });
                        }}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateRoleModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer Rôle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CRÉATION UTILISATEUR */}
      {showCreateUserModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Nouveau Collaborateur</h3>
            <form onSubmit={handleCreateUser} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Nom Complet</label>
                <input type="text" required value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} className="input-clean" placeholder="Oumar Diallo" />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Email</label>
                <input type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="input-clean" placeholder="oumar@roumtransit.com" />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Mot de Passe (min 8 car.)</label>
                <input type="password" required minLength={8} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="input-clean" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Rôle</label>
                  <select value={newUser.role_id} onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })} className="input-clean">
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Hub</label>
                  <input type="text" value={newUser.hub_location} onChange={(e) => setNewUser({ ...newUser, hub_location: e.target.value })} className="input-clean" placeholder="Guangzhou" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateUserModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Créer Compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : NOUVEAU TARIF */}
      {showCreateTariffModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28, 24, 21, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card-clean" style={{ maxWidth: "460px", width: "100%", padding: "26px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "14px" }}>Nouveau Tarif</h3>
            <form onSubmit={handleCreateTariff} style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Route</label>
                  <select value={newTariff.route_id} onChange={(e) => setNewTariff({ ...newTariff, route_id: e.target.value })} className="input-clean">
                    {routesList.map((r) => (
                      <option key={r.id} value={r.id}>{r.origin_country} → {r.destination_country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Mode</label>
                  <select value={newTariff.shipping_mode_id} onChange={(e) => setNewTariff({ ...newTariff, shipping_mode_id: e.target.value })} className="input-clean">
                    {modesList.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Prix Unitaire ($)</label>
                  <input type="number" step="0.01" min="0.1" required value={newTariff.price_per_unit} onChange={(e) => setNewTariff({ ...newTariff, price_per_unit: Number(e.target.value) })} className="input-clean" />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px", fontWeight: "600" }}>Min. Facturé ($)</label>
                  <input type="number" min="0" value={newTariff.minimum_charge} onChange={(e) => setNewTariff({ ...newTariff, minimum_charge: Number(e.target.value) })} className="input-clean" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateTariffModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer Tarif</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
