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

  // Vérification de session au chargement
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
      setLoginError("Erreur de connexion au serveur.");
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
      // 1. Stats
      fetch("/api/admin/stats", { headers })
        .then((r) => r.json())
        .then((d) => d.stats && setStats(d.stats))
        .catch(() => {});

      // 2. Expéditions
      fetch("/api/admin/shipments", { headers })
        .then((r) => r.json())
        .then((d) => d.shipments && setShipments(d.shipments))
        .catch(() => {});

      // 3. Demandes reçues
      fetch("/api/admin/requests", { headers })
        .then((r) => r.json())
        .then((d) => d.requests && setRequestsList(d.requests))
        .catch(() => {});

      // 4. Clients
      fetch("/api/admin/clients", { headers })
        .then((r) => r.json())
        .then((d) => d.clients && setClientsList(d.clients))
        .catch(() => {});

      // 5. Tarifs & Routes
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

      // 6. Finances & Paiements
      fetch("/api/admin/payments", { headers })
        .then((r) => r.json())
        .then((d) => d.payments && setPaymentsList(d.payments))
        .catch(() => {});

      // 7. Tâches
      fetch("/api/admin/tasks", { headers })
        .then((r) => r.json())
        .then((d) => d.tasks && setTasksList(d.tasks))
        .catch(() => {});

      // 8. Rôles & Statuts & Utilisateurs
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

      // 9. Paramètres & Audit
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

  // Création d'expédition
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

  // Mise à jour de statut
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

  // Consigner un paiement
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

  // Création de client
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

  // Création de tâche
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

  // Basculer le statut d'une tâche
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

  // Création de rôle
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

  // Création d'utilisateur
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

  // Création de tarif
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

  // Mise à jour du statut d'une demande client
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={36} className="spin" color="var(--gold)" />
      </div>
    );
  }

  // ÉCRAN 1 : CONNEXION STRICTEMENT VERROUILLÉE
  if (!token || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "radial-gradient(circle at center, #231c18 0%, #171412 100%)",
        }}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: "440px",
            width: "100%",
            padding: "44px 36px",
            border: "1px solid var(--border-active)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #d4af37 0%, #4A2C20 100%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FAF7F2",
                fontWeight: "800",
                fontSize: "1.5rem",
                marginBottom: "16px",
                boxShadow: "0 8px 24px rgba(212, 175, 55, 0.35)",
              }}
            >
              RT
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", marginBottom: "6px" }}>
              Portail d&apos;Administration
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Accès strictement restreint au personnel habilité de ROUM TRANSIT.
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(224, 86, 86, 0.15)",
                border: "1px solid rgba(224, 86, 86, 0.4)",
                borderRadius: "var(--radius-sm)",
                color: "#fb7185",
                fontSize: "0.85rem",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={18} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "6px" }}>
                Identifiant / Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="prenom@roumtransit.com"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "6px" }}>
                Mot de Passe Sécurisé
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", marginTop: "8px" }}
            >
              {loginLoading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Authentification en cours...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Se Connecter
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              textAlign: "center",
              fontSize: "0.78rem",
              color: "var(--text-dim)",
            }}
          >
            🔒 Chiffrement PBKDF2 & JWT · Traçabilité IP & Audit Actifs
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN 2 : TABLEAU DE BORD COMPLET DU PANNEAU D'ADMINISTRATION
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* SIDEBAR DE NAVIGATION */}
      <aside
        style={{
          width: "270px",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* En-tête Marque */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 8px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #d4af37 0%, #4A2C20 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FAF7F2",
              fontWeight: "800",
              fontSize: "1.1rem",
            }}
          >
            RT
          </div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "var(--text-main)", lineHeight: "1.2" }}>
              ROUM TRANSIT
            </div>
            <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--gold)", letterSpacing: "0.1em" }}>
              PANEL OPÉRATIONNEL
            </div>
          </div>
        </div>

        {/* Profil Utilisateur Actif */}
        <div
          style={{
            padding: "12px",
            background: "rgba(242, 230, 213, 0.04)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-main)" }}>
            {user.fullName}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--gold)", marginTop: "2px" }}>
            {user.roleName} {user.isSuperAdmin && "★ Super Admin"}
          </div>
          {user.hubLocation && (
            <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "4px" }}>
              📍 {user.hubLocation}
            </div>
          )}
        </div>

        {/* Menu Principal */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "dashboard" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "dashboard" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "dashboard" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.9rem",
              transition: "all 0.15s ease",
            }}
          >
            <LayoutDashboard size={18} />
            Tableau de Bord
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "requests" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "requests" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "requests" ? "700" : "500",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Inbox size={18} />
              Demandes reçues
            </span>
            {stats?.pending_requests > 0 && (
              <span
                style={{
                  background: "var(--rose)",
                  color: "#fff",
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "10px",
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
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "shipments" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "shipments" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "shipments" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.9rem",
            }}
          >
            <Package size={18} />
            Expéditions & Colis
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "clients" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "clients" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "clients" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.9rem",
            }}
          >
            <Users size={18} />
            Clients
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tariffs")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "tariffs" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "tariffs" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "tariffs" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.9rem",
            }}
          >
            <Truck size={18} />
            Tarifs & Routes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finances")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "finances" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "finances" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "finances" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.9rem",
            }}
          >
            <DollarSign size={18} />
            Paiements & Finances
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "tasks" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "tasks" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "tasks" ? "700" : "500",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckSquare size={18} />
              Tâches d&apos;Équipe
            </span>
            {stats?.pending_tasks > 0 && (
              <span
                style={{
                  background: "var(--caramel)",
                  color: "#171412",
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontWeight: "700",
                }}
              >
                {stats.pending_tasks}
              </span>
            )}
          </button>

          {/* Rôles & Employés (Super Admin Uniquement) */}
          {user.isSuperAdmin && (
            <>
              <div
                style={{
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  padding: "16px 14px 6px 14px",
                  letterSpacing: "0.1em",
                }}
              >
                Administration Système
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("roles")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: activeTab === "roles" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  color: activeTab === "roles" ? "var(--gold)" : "var(--text-muted)",
                  fontWeight: activeTab === "roles" ? "700" : "500",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.9rem",
                }}
              >
                <Sliders size={18} />
                Rôles & Permissions
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: activeTab === "users" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  color: activeTab === "users" ? "var(--gold)" : "var(--text-muted)",
                  fontWeight: activeTab === "users" ? "700" : "500",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "0.9rem",
                }}
              >
                <Building2 size={18} />
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
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: activeTab === "settings" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "settings" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: activeTab === "settings" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.9rem",
              marginTop: "auto",
            }}
          >
            <Settings size={18} />
            Paramètres & Audit
          </button>
        </nav>

        {/* Déconnexion */}
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center", gap: "8px", fontSize: "0.85rem", padding: "10px" }}
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </aside>

      {/* CONTENU PRINCIPAL DE L'ONGLET */}
      <main style={{ flex: 1, padding: "36px 40px", overflowY: "auto", maxHeight: "100vh" }}>
        {/* BARRE SUPÉRIEURE D'ACTIONS RAPIDES */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.7rem", fontWeight: "800", color: "var(--text-main)" }}>
              {activeTab === "dashboard" && "Tableau de Bord & Activité"}
              {activeTab === "requests" && "Demandes & Sourcing Reçus"}
              {activeTab === "shipments" && "Gestion des Expéditions & Colis"}
              {activeTab === "clients" && "Répertoire des Clients"}
              {activeTab === "tariffs" && "Grilles Tarifaires & Liaisons"}
              {activeTab === "finances" && "Paiements & Encaissements"}
              {activeTab === "tasks" && "Suivi des Tâches Opérationnelles"}
              {activeTab === "roles" && "Rôles Dynamiques & Permissions"}
              {activeTab === "users" && "Gestion des Comptes Collaborateurs"}
              {activeTab === "settings" && "Paramètres Généraux & Journal d'Audit"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "4px" }}>
              ROUM TRANSIT · Espace de gestion sécurisé
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => token && loadDashboardData(token)}
              className="btn btn-secondary"
              style={{ padding: "10px 14px" }}
              title="Actualiser les données"
            >
              <RefreshCw size={16} className={isRefreshing ? "spin" : ""} />
            </button>

            {activeTab === "shipments" && (
              <>
                <a
                  href="/api/admin/exports/shipments.csv"
                  className="btn btn-secondary"
                  style={{ padding: "10px 16px", fontSize: "0.85rem", gap: "6px" }}
                >
                  <Download size={16} />
                  Export CSV
                </a>
                <button
                  type="button"
                  onClick={() => setShowCreateShipmentModal(true)}
                  className="btn btn-primary"
                  style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
                >
                  <Plus size={16} />
                  Nouvelle Expédition
                </button>
              </>
            )}

            {activeTab === "clients" && (
              <button
                type="button"
                onClick={() => setShowCreateClientModal(true)}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
              >
                <Plus size={16} />
                Nouveau Client
              </button>
            )}

            {activeTab === "finances" && (
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal({})}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
              >
                <Plus size={16} />
                Consigner un Paiement
              </button>
            )}

            {activeTab === "tasks" && (
              <button
                type="button"
                onClick={() => setShowCreateTaskModal(true)}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
              >
                <Plus size={16} />
                Nouvelle Tâche
              </button>
            )}

            {activeTab === "tariffs" && (
              <button
                type="button"
                onClick={() => setShowCreateTariffModal(true)}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
              >
                <Plus size={16} />
                Nouveau Tarif
              </button>
            )}

            {activeTab === "roles" && (
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(true)}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
              >
                <Plus size={16} />
                Créer un Rôle
              </button>
            )}

            {activeTab === "users" && (
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
              >
                <Plus size={16} />
                Nouveau Compte
              </button>
            )}
          </div>
        </div>

        {/* 1. ONGLET : TABLEAU DE BORD (STATS & KPIS) */}
        {activeTab === "dashboard" && (
          <div>
            {/* Grille de KPIs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "18px",
                marginBottom: "36px",
              }}
            >
              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Expéditions Actives
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--gold)" }}>
                  {stats?.active_shipments || 0}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
                  Sur {stats?.total_shipments || 0} expéditions totales
                </div>
              </div>

              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Demandes en Attente
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--rose)" }}>
                  {stats?.pending_requests || 0}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
                  Alibaba & transit à traiter
                </div>
              </div>

              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Clients Enregistrés
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--caramel)" }}>
                  {stats?.total_clients || 0}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
                  Répertoire vérifié
                </div>
              </div>

              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Paiements Encaissés
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--emerald)" }}>
                  ${((stats?.total_payments_minor || 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
                  Total consigné en caisse
                </div>
              </div>
            </div>

            {/* Deux colonnes : Expéditions récentes + Tâches urgentes */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
              <div className="glass-card" style={{ padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.1rem" }}>Dernières Expéditions</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("shipments")}
                    style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Voir tout →
                  </button>
                </div>
                <div style={{ display: "grid", gap: "12px" }}>
                  {shipments.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "12px",
                        background: "rgba(242, 230, 213, 0.03)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong style={{ color: "var(--gold)" }}>{s.tracking_number}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {s.client_name} · {s.origin_country} → {s.destination_country}
                        </div>
                      </div>
                      <span className={`status-badge status-${s.current_status.toLowerCase().includes("transit") ? "transit" : "hub"}`}>
                        {s.status_label || s.current_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.1rem" }}>Tâches Prioritaires</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tasks")}
                    style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Gérer ({tasksList.length}) →
                  </button>
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  {tasksList.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "12px",
                        background: "rgba(242, 230, 213, 0.03)",
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
                        style={{ cursor: "pointer", accentColor: "var(--gold)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.88rem", textDecoration: t.status === "DONE" ? "line-through" : "none" }}>
                          {t.title}
                        </div>
                        {t.due_date && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                            Échéance : {t.due_date}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: t.priority === "URGENT" ? "rgba(224, 86, 86, 0.2)" : "rgba(242, 230, 213, 0.08)",
                          color: t.priority === "URGENT" ? "var(--rose)" : "var(--text-muted)",
                        }}
                      >
                        {t.priority}
                      </span>
                    </div>
                  ))}
                  {tasksList.length === 0 && (
                    <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>
                      Aucune tâche en attente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ONGLET : DEMANDES REÇUES (ALIBABA, TRANSIT, COLIS) */}
        {activeTab === "requests" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Rechercher par référence, nom client, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ maxWidth: "450px" }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                    <th style={{ padding: "12px 8px" }}>Réf. Demande</th>
                    <th style={{ padding: "12px 8px" }}>Type</th>
                    <th style={{ padding: "12px 8px" }}>Client</th>
                    <th style={{ padding: "12px 8px" }}>Origine → Dest.</th>
                    <th style={{ padding: "12px 8px" }}>Détails / Poids</th>
                    <th style={{ padding: "12px 8px" }}>Statut</th>
                    <th style={{ padding: "12px 8px" }}>Actions</th>
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
                      <tr key={r.id} style={{ borderBottom: "1px solid rgba(242, 230, 213, 0.05)" }}>
                        <td style={{ padding: "14px 8px", fontWeight: "700", color: "var(--gold)" }}>
                          {r.reference}
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: r.request_type === "ALIBABA" ? "rgba(212, 175, 55, 0.15)" : "rgba(166, 124, 82, 0.15)",
                              color: r.request_type === "ALIBABA" ? "var(--gold)" : "var(--light-brown)",
                            }}
                          >
                            {r.request_type === "ALIBABA" ? "Achat Alibaba" : r.request_type}
                          </span>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{r.client_name}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{r.client_phone}</div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          {r.origin_country || "Chine"} → {r.destination_country || "Afrique"}
                        </td>
                        <td style={{ padding: "14px 8px", fontSize: "0.85rem" }}>
                          {r.estimated_weight_kg ? `${r.estimated_weight_kg} kg` : "Non spécifié"}
                          {r.description && <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>{r.description.slice(0, 35)}...</div>}
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateRequestStatus(r.id, e.target.value)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "rgba(23, 20, 18, 0.8)",
                              color: "var(--text-main)",
                              border: "1px solid var(--border-subtle)",
                              fontSize: "0.82rem",
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
                        <td style={{ padding: "14px 8px" }}>
                          <a
                            href={`https://wa.me/${r.client_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Bonjour ${r.client_name}, concernant votre demande ${r.reference} chez ROUM TRANSIT :`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-whatsapp"
                            style={{ padding: "6px 12px", fontSize: "0.78rem", gap: "4px" }}
                          >
                            <Phone size={14} /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  {requestsList.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-dim)" }}>
                        Aucune demande client enregistrée pour l&apos;instant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ONGLET : EXPÉDITIONS & COLIS */}
        {activeTab === "shipments" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Rechercher par n° suivi, client, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ maxWidth: "400px" }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ maxWidth: "220px" }}
              >
                <option value="">Tous les statuts</option>
                {allStatuses.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.label_public}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                    <th style={{ padding: "12px 8px" }}>N° Suivi</th>
                    <th style={{ padding: "12px 8px" }}>Client</th>
                    <th style={{ padding: "12px 8px" }}>Liaison</th>
                    <th style={{ padding: "12px 8px" }}>Mode</th>
                    <th style={{ padding: "12px 8px" }}>Colis / Poids</th>
                    <th style={{ padding: "12px 8px" }}>Statut Actuel</th>
                    <th style={{ padding: "12px 8px" }}>Paiement</th>
                    <th style={{ padding: "12px 8px" }}>Actions</th>
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
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(242, 230, 213, 0.05)" }}>
                        <td style={{ padding: "14px 8px" }}>
                          <Link
                            href={`/tracking/${s.tracking_number}`}
                            target="_blank"
                            style={{ fontWeight: "700", color: "var(--gold)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {s.tracking_number}
                            <ExternalLink size={12} />
                          </Link>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                            {new Date(s.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{s.client_name}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{s.client_phone}</div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          {s.origin_country} → {s.destination_country}
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <span style={{ fontSize: "0.82rem", color: "var(--caramel)", fontWeight: "600" }}>
                            {s.shipping_mode_name}
                          </span>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <div>{s.total_parcels_count} colis</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{s.total_weight_kg} kg</div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <span className={`status-badge status-${s.current_status.toLowerCase().includes("transit") ? "transit" : "hub"}`}>
                            {s.status_label || s.current_status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: s.payment_status === "PAID" ? "rgba(16, 185, 129, 0.15)" : "rgba(242, 230, 213, 0.08)",
                              color: s.payment_status === "PAID" ? "var(--emerald)" : "var(--text-muted)",
                            }}
                          >
                            {s.payment_status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => setShowStatusModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                              title="Changer statut"
                            >
                              Changer statut
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPrintLabelModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                              title="Imprimer étiquette / bordereau"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {shipments.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-dim)" }}>
                        Aucune expédition enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ONGLET : RÉPERTOIRE DES CLIENTS */}
        {activeTab === "clients" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Rechercher un client par nom, WhatsApp, pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ maxWidth: "450px" }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                    <th style={{ padding: "12px 8px" }}>Client</th>
                    <th style={{ padding: "12px 8px" }}>WhatsApp / Téléphone</th>
                    <th style={{ padding: "12px 8px" }}>Email</th>
                    <th style={{ padding: "12px 8px" }}>Pays / Ville</th>
                    <th style={{ padding: "12px 8px" }}>Dossiers</th>
                    <th style={{ padding: "12px 8px" }}>Action Directe</th>
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
                      <tr key={c.id} style={{ borderBottom: "1px solid rgba(242, 230, 213, 0.05)" }}>
                        <td style={{ padding: "14px 8px", fontWeight: "700", color: "var(--text-main)" }}>
                          {c.full_name}
                        </td>
                        <td style={{ padding: "14px 8px", color: "var(--gold)" }}>
                          {c.phone_whatsapp}
                        </td>
                        <td style={{ padding: "14px 8px", color: "var(--text-muted)" }}>
                          {c.email || "—"}
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          {c.city ? `${c.city}, ` : ""}{c.country}
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <span style={{ fontWeight: "600", color: "var(--caramel)" }}>
                            {c.shipments_count || 0} colis
                          </span>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <a
                            href={`https://wa.me/${c.phone_whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Bonjour ${c.full_name}, nous vous contactons depuis ROUM TRANSIT :`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-whatsapp"
                            style={{ padding: "6px 12px", fontSize: "0.78rem", gap: "4px" }}
                          >
                            <Phone size={14} /> Discuter
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ONGLET : TARIFS & ROUTES */}
        {activeTab === "tariffs" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>Grilles Tarifaires Actives</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                    <th style={{ padding: "12px 8px" }}>Origine → Destination</th>
                    <th style={{ padding: "12px 8px" }}>Mode de Transport</th>
                    <th style={{ padding: "12px 8px" }}>Prix Unitaire</th>
                    <th style={{ padding: "12px 8px" }}>Base de Calcul</th>
                    <th style={{ padding: "12px 8px" }}>Min. Facturation</th>
                    <th style={{ padding: "12px 8px" }}>Délais Estimés</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffsList.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid rgba(242, 230, 213, 0.05)" }}>
                      <td style={{ padding: "14px 8px", fontWeight: "700", color: "var(--text-main)" }}>
                        {t.origin_city ? `${t.origin_city} (${t.origin_country})` : t.origin_country} →{" "}
                        {t.destination_city ? `${t.destination_city} (${t.destination_country})` : t.destination_country}
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--gold)" }}>
                        {t.shipping_mode_name}
                      </td>
                      <td style={{ padding: "14px 8px", fontWeight: "700", color: "var(--emerald)" }}>
                        ${(t.price_per_unit_minor / 100).toFixed(2)} / {t.pricing_basis === "PER_KG" ? "kg" : "m³"}
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--text-muted)" }}>
                        {t.pricing_basis}
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--text-dim)" }}>
                        ${(t.minimum_charge_minor / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        {t.estimated_days_min} à {t.estimated_days_max} jours ouvrés
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. ONGLET : FINANCES & PAIEMENTS */}
        {activeTab === "finances" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem" }}>Historique des Paiements Consignés</h3>
              <div style={{ fontSize: "0.9rem", color: "var(--emerald)", fontWeight: "700" }}>
                Total : ${((stats?.total_payments_minor || 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                    <th style={{ padding: "12px 8px" }}>Date</th>
                    <th style={{ padding: "12px 8px" }}>Client</th>
                    <th style={{ padding: "12px 8px" }}>Dossier</th>
                    <th style={{ padding: "12px 8px" }}>Montant</th>
                    <th style={{ padding: "12px 8px" }}>Méthode</th>
                    <th style={{ padding: "12px 8px" }}>Type</th>
                    <th style={{ padding: "12px 8px" }}>Réf / Reçu</th>
                    <th style={{ padding: "12px 8px" }}>Enregistré par</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(242, 230, 213, 0.05)" }}>
                      <td style={{ padding: "14px 8px", color: "var(--text-dim)" }}>
                        {new Date(p.recorded_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td style={{ padding: "14px 8px", fontWeight: "600", color: "var(--text-main)" }}>
                        {p.client_name}
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--gold)" }}>
                        {p.tracking_number || "—"}
                      </td>
                      <td style={{ padding: "14px 8px", fontWeight: "800", color: "var(--emerald)" }}>
                        ${(p.amount_minor / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "rgba(212, 175, 55, 0.15)",
                            color: "var(--gold)",
                          }}
                        >
                          {p.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--text-muted)" }}>
                        {p.payment_type}
                      </td>
                      <td style={{ padding: "14px 8px", fontSize: "0.82rem", color: "var(--text-dim)" }}>
                        {p.reference_code || "Manuel"}
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--text-dim)" }}>
                        {p.recorded_by_name}
                      </td>
                    </tr>
                  ))}
                  {paymentsList.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-dim)" }}>
                        Aucun paiement consigné pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. ONGLET : TÂCHES D'ÉQUIPE */}
        {activeTab === "tasks" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ display: "grid", gap: "14px" }}>
              {tasksList.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: "16px 20px",
                    background: "rgba(242, 230, 213, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <input
                      type="checkbox"
                      checked={t.status === "DONE"}
                      onChange={() => handleToggleTaskStatus(t.id, t.status)}
                      style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--gold)" }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: t.status === "DONE" ? "var(--text-dim)" : "var(--text-main)",
                          textDecoration: t.status === "DONE" ? "line-through" : "none",
                        }}
                      >
                        {t.title}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {t.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "6px" }}>
                        <span>Catégorie : {t.category}</span>
                        {t.due_date && <span>📅 Échéance : {t.due_date}</span>}
                        {t.assigned_to_name && <span>👤 Assigné à : {t.assigned_to_name}</span>}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: t.priority === "URGENT" ? "rgba(224, 86, 86, 0.2)" : "rgba(242, 230, 213, 0.08)",
                      color: t.priority === "URGENT" ? "var(--rose)" : "var(--gold)",
                    }}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
              {tasksList.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>
                  Toutes les tâches sont terminées ! Cliquez sur &apos;Nouvelle Tâche&apos; pour en créer une.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. ONGLET : RÔLES & PERMISSIONS DYNAMIQUES (Super Admin) */}
        {activeTab === "roles" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ display: "grid", gap: "20px" }}>
              {roles.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "20px",
                    background: "rgba(242, 230, 213, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <strong style={{ fontSize: "1.1rem", color: "var(--gold)" }}>{r.name}</strong>
                      {r.is_system === 1 && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(212, 175, 55, 0.2)",
                            color: "var(--gold)",
                            fontWeight: "700",
                          }}
                        >
                          Système (Protégé)
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      {r.users_count || 0} collaborateur(s)
                    </span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "14px" }}>
                    {r.description || "Aucune description fournie."}
                  </p>

                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Permissions ({r.permissions?.length || 0})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {r.id === "SUPER_ADMIN" ? (
                        <span style={{ fontSize: "0.78rem", color: "var(--emerald)", fontWeight: "700" }}>
                          Accès total sans restriction (*)
                        </span>
                      ) : (
                        r.permissions?.map((p: string) => (
                          <span
                            key={p}
                            style={{
                              fontSize: "0.72rem",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(242, 230, 213, 0.08)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Statuts d&apos;expédition autorisés ({r.allowed_statuses?.length || 0})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {r.id === "SUPER_ADMIN" ? (
                        <span style={{ fontSize: "0.78rem", color: "var(--emerald)", fontWeight: "700" }}>
                          Tous les statuts (*)
                        </span>
                      ) : (
                        r.allowed_statuses?.map((st: string) => (
                          <span
                            key={st}
                            style={{
                              fontSize: "0.72rem",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(166, 124, 82, 0.15)",
                              color: "var(--light-brown)",
                            }}
                          >
                            {st}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. ONGLET : COLLABORATEURS (Super Admin) */}
        {activeTab === "users" && (
          <div className="glass-card" style={{ padding: "28px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                    <th style={{ padding: "12px 8px" }}>Nom Collaborateur</th>
                    <th style={{ padding: "12px 8px" }}>Email</th>
                    <th style={{ padding: "12px 8px" }}>Rôle Attribué</th>
                    <th style={{ padding: "12px 8px" }}>Hub / Localisation</th>
                    <th style={{ padding: "12px 8px" }}>Statut Compte</th>
                    <th style={{ padding: "12px 8px" }}>Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(242, 230, 213, 0.05)" }}>
                      <td style={{ padding: "14px 8px", fontWeight: "700", color: "var(--text-main)" }}>
                        {u.full_name}
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--gold)" }}>
                        {u.email}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "rgba(212, 175, 55, 0.15)",
                            color: "var(--gold)",
                          }}
                        >
                          {u.role_name}
                        </span>
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--text-muted)" }}>
                        {u.hub_location || "Non assigné"}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: u.is_active === 1 ? "rgba(16, 185, 129, 0.15)" : "rgba(224, 86, 86, 0.15)",
                            color: u.is_active === 1 ? "var(--emerald)" : "var(--rose)",
                          }}
                        >
                          {u.is_active === 1 ? "ACTIF" : "DÉSACTIVÉ"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 8px", color: "var(--text-dim)" }}>
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 10. ONGLET : PARAMÈTRES & JOURNAL D'AUDIT */}
        {activeTab === "settings" && (
          <div style={{ display: "grid", gap: "28px" }}>
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Paramètres Opérationnels ROUM TRANSIT</h3>
              <div style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "6px" }}>
                    Nom Entreprise
                  </label>
                  <input
                    type="text"
                    value={companySettings.company_name || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "6px" }}>
                    Adresse Entrepôt Chine (Guangzhou)
                  </label>
                  <textarea
                    rows={2}
                    value={companySettings.warehouse_china_address || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, warehouse_china_address: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "6px" }}>
                    Shipping Mark Modèle
                  </label>
                  <input
                    type="text"
                    value={companySettings.warehouse_china_shipping_mark || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, warehouse_china_shipping_mark: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "6px" }}>
                    Numéro WhatsApp Officiel
                  </label>
                  <input
                    type="text"
                    value={companySettings.whatsapp_official_number || ""}
                    onChange={(e) => setCompanySettings({ ...companySettings, whatsapp_official_number: e.target.value })}
                    className="input-field"
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
                    alert("Paramètres enregistrés avec succès !");
                  }}
                  className="btn btn-primary"
                  style={{ width: "fit-content", padding: "10px 24px" }}
                >
                  Enregistrer les Paramètres
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Journal d&apos;Audit Sécurisé</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                      <th style={{ padding: "10px 8px" }}>Date</th>
                      <th style={{ padding: "10px 8px" }}>Opérateur</th>
                      <th style={{ padding: "10px 8px" }}>Action</th>
                      <th style={{ padding: "10px 8px" }}>Entité</th>
                      <th style={{ padding: "10px 8px" }}>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((l) => (
                      <tr key={l.id} style={{ borderBottom: "1px solid rgba(242, 230, 213, 0.05)" }}>
                        <td style={{ padding: "12px 8px", color: "var(--text-dim)" }}>
                          {new Date(l.created_at).toLocaleString("fr-FR")}
                        </td>
                        <td style={{ padding: "12px 8px", fontWeight: "600", color: "var(--text-main)" }}>
                          {l.user_name || "Système"}
                        </td>
                        <td style={{ padding: "12px 8px", color: "var(--gold)" }}>
                          {l.action}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          {l.entity_type} {l.entity_id ? `(${l.entity_id.slice(0, 8)})` : ""}
                        </td>
                        <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>
                          {l.details_json || "—"}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
                          Aucun log d&apos;audit pour l&apos;instant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALE : CRÉATION D'EXPÉDITION */}
      {showCreateShipmentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "600px",
              width: "100%",
              padding: "36px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Nouvelle Expédition & Colis</h3>
            <form onSubmit={handleCreateShipment} style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Nom Client
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.client_name}
                    onChange={(e) => setNewShipment({ ...newShipment, client_name: e.target.value })}
                    className="input-field"
                    placeholder="Moussa Traoré"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Téléphone WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipment.client_phone}
                    onChange={(e) => setNewShipment({ ...newShipment, client_phone: e.target.value })}
                    className="input-field"
                    placeholder="+22370000000"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Liaison / Route
                  </label>
                  <select
                    value={newShipment.route_id}
                    onChange={(e) => setNewShipment({ ...newShipment, route_id: e.target.value })}
                    className="input-field"
                  >
                    {routesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.origin_country} → {r.destination_country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Mode de Transport
                  </label>
                  <select
                    value={newShipment.shipping_mode_id}
                    onChange={(e) => setNewShipment({ ...newShipment, shipping_mode_id: e.target.value })}
                    className="input-field"
                  >
                    {modesList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Libellé / Étiquette Colis
                  </label>
                  <input
                    type="text"
                    value={newShipment.package_label}
                    onChange={(e) => setNewShipment({ ...newShipment, package_label: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newShipment.weight_kg}
                    onChange={(e) => setNewShipment({ ...newShipment, weight_kg: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Description de la Marchandise
                </label>
                <input
                  type="text"
                  value={newShipment.description}
                  onChange={(e) => setNewShipment({ ...newShipment, description: e.target.value })}
                  className="input-field"
                  placeholder="Ex : Chaussures, tissus, pièces auto..."
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateShipmentModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer et Générer Suivi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CHANGEMENT DE STATUT GUIDÉ */}
      {showStatusModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>
              Mise à jour statut : {showStatusModal.tracking_number}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
              Statut actuel : <strong style={{ color: "var(--gold)" }}>{showStatusModal.status_label || showStatusModal.current_status}</strong>
            </p>

            <form onSubmit={handleUpdateStatus} style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Nouveau Statut
                </label>
                <select
                  value={statusUpdate.new_status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, new_status: e.target.value })}
                  className="input-field"
                >
                  {allStatuses
                    .filter(
                      (st) =>
                        user.isSuperAdmin ||
                        user.allowedStatuses.includes("*") ||
                        user.allowedStatuses.includes(st.code)
                    )
                    .map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.label_public} ({st.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Localisation Actuelle du Colis
                </label>
                <input
                  type="text"
                  required
                  value={statusUpdate.location}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, location: e.target.value })}
                  className="input-field"
                  placeholder="Ex : Port de Casablanca, Hub Guangzhou..."
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Commentaire Visible par le Client (Optionnel)
                </label>
                <input
                  type="text"
                  value={statusUpdate.comment}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                  className="input-field"
                  placeholder="Ex : Chargement conteneur effectué sans anomalie"
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(null)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Valider et Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : ÉTIQUETTE / BORDEREAU DE COLIS IMPRIMABLE */}
      {showPrintLabelModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "520px",
              width: "100%",
              padding: "36px",
              background: "#fff",
              color: "#000",
              borderRadius: "16px",
            }}
          >
            <div style={{ borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "900", fontSize: "1.3rem" }}>ROUM TRANSIT</div>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#666" }}>WHOLESALE & BOUTIQUE</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "700" }}>BORDEREAU D&apos;EXPÉDITION</div>
                <div style={{ fontSize: "0.75rem", color: "#666" }}>{new Date().toLocaleDateString("fr-FR")}</div>
              </div>
            </div>

            <div style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px", marginBottom: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "4px" }}>CODE DE SUIVI UNIQUE</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "900", letterSpacing: "1px" }}>
                {showPrintLabelModal.tracking_number}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", fontSize: "0.85rem" }}>
              <div>
                <strong style={{ color: "#666", display: "block", fontSize: "0.75rem" }}>DESTINATAIRE</strong>
                <div style={{ fontWeight: "800", fontSize: "1rem" }}>{showPrintLabelModal.client_name}</div>
                <div>{showPrintLabelModal.client_phone}</div>
              </div>
              <div>
                <strong style={{ color: "#666", display: "block", fontSize: "0.75rem" }}>LIAISON</strong>
                <div style={{ fontWeight: "800" }}>{showPrintLabelModal.origin_country} → {showPrintLabelModal.destination_country}</div>
                <div>Mode : {showPrintLabelModal.shipping_mode_name}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", fontSize: "0.85rem", borderTop: "1px dashed #ccc", paddingTop: "12px" }}>
              <div>
                <strong style={{ color: "#666", display: "block", fontSize: "0.75rem" }}>POIDS BRUT</strong>
                <div style={{ fontWeight: "800" }}>{showPrintLabelModal.total_weight_kg} KG</div>
              </div>
              <div>
                <strong style={{ color: "#666", display: "block", fontSize: "0.75rem" }}>NOMBRE DE COLIS</strong>
                <div style={{ fontWeight: "800" }}>{showPrintLabelModal.total_parcels_count} COLIS</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowPrintLabelModal(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer" }}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#000", color: "#fff", fontWeight: "700", cursor: "pointer" }}
              >
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : NOUVEAU CLIENT */}
      {showCreateClientModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "32px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Ajouter un Client</h3>
            <form onSubmit={handleCreateClient} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={newClient.full_name}
                  onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
                  className="input-field"
                  placeholder="Ex : Fatoumata Coulibaly"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  WhatsApp / Téléphone
                </label>
                <input
                  type="text"
                  required
                  value={newClient.phone_whatsapp}
                  onChange={(e) => setNewClient({ ...newClient, phone_whatsapp: e.target.value })}
                  className="input-field"
                  placeholder="+22370000000"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Pays
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient.country}
                    onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                    className="input-field"
                    placeholder="Mali"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Ville
                  </label>
                  <input
                    type="text"
                    value={newClient.city}
                    onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                    className="input-field"
                    placeholder="Bamako"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateClientModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CONSIGNER UN PAIEMENT */}
      {showRecordPaymentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div className="glass-card" style={{ maxWidth: "520px", width: "100%", padding: "32px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Consigner un Paiement</h3>
            <form onSubmit={handleRecordPayment} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Client Bénéficiaire
                </label>
                <select
                  required
                  value={newPayment.client_id}
                  onChange={(e) => setNewPayment({ ...newPayment, client_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sélectionner un client</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone_whatsapp})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Montant Encaissé ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Devise
                  </label>
                  <input type="text" disabled value="USD" className="input-field" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Méthode
                  </label>
                  <select
                    value={newPayment.payment_method}
                    onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
                    className="input-field"
                  >
                    <option value="WAVE">Wave</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="CASH">Espèces</option>
                    <option value="BANK_TRANSFER">Virement Bancaire</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Type de Règlement
                  </label>
                  <select
                    value={newPayment.payment_type}
                    onChange={(e) => setNewPayment({ ...newPayment, payment_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="ADVANCE">Acompte</option>
                    <option value="BALANCE">Solde</option>
                    <option value="FULL">Paiement Intégral</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Référence Transaction Mobile / Banque
                </label>
                <input
                  type="text"
                  value={newPayment.reference_code}
                  onChange={(e) => setNewPayment({ ...newPayment, reference_code: e.target.value })}
                  className="input-field"
                  placeholder="Ex : TXN-8392019"
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(null)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Valider l&apos;Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : NOUVELLE TÂCHE */}
      {showCreateTaskModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "32px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Créer une Tâche d&apos;Équipe</h3>
            <form onSubmit={handleCreateTask} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Titre de la Tâche
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="input-field"
                  placeholder="Ex : Vérifier colis fournisseur Alibaba"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Description / Consignes
                </label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Priorité
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Normale</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Échéance
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer la Tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CRÉATION DE RÔLE DYNAMIQUE */}
      {showCreateRoleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "680px",
              width: "100%",
              padding: "36px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>Créer un Rôle Dynamique (RBAC)</h3>
            <form onSubmit={handleCreateRole} style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Nom du Rôle
                </label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="input-field"
                  placeholder="Ex : Agent Entrepôt Guangzhou, Commercial Sourcing..."
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Description de la mission
                </label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
                  Permissions Accordées
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "10px",
                    background: "rgba(23, 20, 18, 0.8)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {allPermissions.map((p) => {
                    const checked = newRole.permissions.includes(p.code);
                    return (
                      <label key={p.code} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRole({ ...newRole, permissions: [...newRole.permissions, p.code] });
                            } else {
                              setNewRole({ ...newRole, permissions: newRole.permissions.filter((code) => code !== p.code) });
                            }
                          }}
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
                  Statuts d&apos;expédition autorisés
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    maxHeight: "140px",
                    overflowY: "auto",
                    padding: "10px",
                    background: "rgba(23, 20, 18, 0.8)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {allStatuses.map((st) => {
                    const checked = newRole.allowed_statuses.includes(st.code);
                    return (
                      <label key={st.code} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRole({ ...newRole, allowed_statuses: [...newRole.allowed_statuses, st.code] });
                            } else {
                              setNewRole({ ...newRole, allowed_statuses: newRole.allowed_statuses.filter((c) => c !== st.code) });
                            }
                          }}
                        />
                        <span>{st.label_public}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer et Enregistrer le Rôle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CRÉATION D'UTILISATEUR */}
      {showCreateUserModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "32px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Nouveau Compte Collaborateur</h3>
            <form onSubmit={handleCreateUser} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="input-field"
                  placeholder="Ex : Oumar Diallo"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Email Professionnel
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                  placeholder="oumar@roumtransit.com"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Mot de Passe Provisoire
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field"
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Rôle Attribué
                  </label>
                  <select
                    value={newUser.role_id}
                    onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                    className="input-field"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Hub / Ville
                  </label>
                  <input
                    type="text"
                    value={newUser.hub_location}
                    onChange={(e) => setNewUser({ ...newUser, hub_location: e.target.value })}
                    className="input-field"
                    placeholder="Guangzhou, Bamako..."
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CRÉATION DE TARIF */}
      {showCreateTariffModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div className="glass-card" style={{ maxWidth: "520px", width: "100%", padding: "32px" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Ajouter une Règle Tarifaire</h3>
            <form onSubmit={handleCreateTariff} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Route / Liaison
                  </label>
                  <select
                    value={newTariff.route_id}
                    onChange={(e) => setNewTariff({ ...newTariff, route_id: e.target.value })}
                    className="input-field"
                  >
                    {routesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.origin_country} → {r.destination_country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Mode de Transport
                  </label>
                  <select
                    value={newTariff.shipping_mode_id}
                    onChange={(e) => setNewTariff({ ...newTariff, shipping_mode_id: e.target.value })}
                    className="input-field"
                  >
                    {modesList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Prix Unitaire ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={newTariff.price_per_unit}
                    onChange={(e) => setNewTariff({ ...newTariff, price_per_unit: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Minimum Facturé ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newTariff.minimum_charge}
                    onChange={(e) => setNewTariff({ ...newTariff, minimum_charge: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Délai Min (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTariff.estimated_days_min}
                    onChange={(e) => setNewTariff({ ...newTariff, estimated_days_min: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                    Délai Max (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTariff.estimated_days_max}
                    onChange={(e) => setNewTariff({ ...newTariff, estimated_days_max: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTariffModal(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer Tarif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
