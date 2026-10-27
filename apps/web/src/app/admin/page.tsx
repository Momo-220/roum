"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Users,
  Plus,
  Search,
  Lock,
  LogOut,
  RefreshCw,
  Sliders,
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
  const [activeTab, setActiveTab] = useState<"shipments" | "roles" | "users" | "tariffs">("shipments");

  // Données expéditions
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Données rôles & permissions
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);

  // Données utilisateurs
  const [usersList, setUsersList] = useState<any[]>([]);

  // Modales
  const [showCreateShipmentModal, setShowCreateShipmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<any | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Formulaire nouveau colis
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

  // Formulaire mise à jour statut
  const [statusUpdate, setStatusUpdate] = useState({
    new_status: "RECEIVED_AT_HUB",
    location: "Hub Entrepôt Guangzhou",
    comment: "Pesé et étiqueté pour expédition",
  });

  // Formulaire nouveau rôle
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: ["shipments.view", "shipments.create", "shipments.status.update"] as string[],
    allowed_statuses: ["RECEIVED_AT_HUB", "PACKED_READY", "IN_TRANSIT"] as string[],
  });

  // Formulaire nouvel utilisateur
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "SUPER_ADMIN",
    hub_location: "Entrepôt Guangzhou",
  });

  // Vérification de session au chargement
  useEffect(() => {
    const savedToken = localStorage.getItem("roum_admin_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);
    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Session invalide");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("roum_admin_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Chargement des expéditions
  const loadShipments = async () => {
    if (!token) return;
    setShipmentsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/shipments${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setShipments(json.shipments || []);
      }
    } finally {
      setShipmentsLoading(false);
    }
  };

  // Chargement des rôles & permissions
  const loadRoles = async () => {
    if (!token || !user?.isSuperAdmin) return;
    try {
      const [rolesRes, permsRes, statusesRes] = await Promise.all([
        fetch("/api/v1/admin/roles", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/v1/admin/permissions", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/v1/admin/statuses", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (rolesRes.ok) {
        const rJson = await rolesRes.json();
        setRoles(rJson.roles || []);
      }
      if (permsRes.ok) {
        const pJson = await permsRes.json();
        setAllPermissions(pJson.permissions || []);
      }
      if (statusesRes.ok) {
        const sJson = await statusesRes.json();
        setAllStatuses(sJson.statuses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chargement des utilisateurs
  const loadUsers = async () => {
    if (!token || !user?.isSuperAdmin) return;
    try {
      const res = await fetch("/api/v1/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setUsersList(json.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token && user) {
      if (activeTab === "shipments") loadShipments();
      if (activeTab === "roles") loadRoles();
      if (activeTab === "users") {
        loadUsers();
        loadRoles();
      }
    }
  }, [token, user, activeTab]);

  // Connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Identifiants invalides.");
      }

      const json = await res.json();
      localStorage.setItem("roum_admin_token", json.token);
      setToken(json.token);
      setUser(json.user);
    } catch (err: any) {
      setLoginError(err.message || "Erreur de connexion.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem("roum_admin_token");
    setToken(null);
    setUser(null);
  };

  // Création d'expédition
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/admin/shipments", {
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

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création.");
        return;
      }

      setShowCreateShipmentModal(false);
      loadShipments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Mise à jour de statut
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStatusModal) return;

    try {
      const res = await fetch(`/api/v1/admin/shipments/${showStatusModal.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statusUpdate),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la mise à jour.");
        return;
      }

      setShowStatusModal(null);
      loadShipments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Création de rôle
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRole),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création du rôle.");
        return;
      }

      setShowCreateRoleModal(false);
      loadRoles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Création d'utilisateur
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création de l'utilisateur.");
        return;
      }

      setShowCreateUserModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <RefreshCw size={36} className="pulse-glow" style={{ animation: "spin 1.5s linear infinite", color: "var(--gold)" }} />
      </div>
    );
  }

  // VUE DE CONNEXION
  if (!user || !token) {
    return (
      <div style={{ padding: "60px 0" }}>
        <div className="container" style={{ maxWidth: "440px" }}>
          <div className="glass-card" style={{ padding: "36px" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(245, 166, 35, 0.15)",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                }}
              >
                <Lock size={26} />
              </div>
              <h2 style={{ fontSize: "1.6rem", marginBottom: "6px" }}>Espace Professionnel</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                Accès réservé aux administrateurs et opérateurs ROUM TRANSIT.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Adresse Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="input-field"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <div style={{ color: "var(--rose)", fontSize: "0.85rem", fontWeight: "500" }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loginLoading}
                style={{ marginTop: "8px", width: "100%" }}
              >
                {loginLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div
              style={{
                marginTop: "24px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8rem",
                color: "var(--text-dim)",
                textAlign: "center",
              }}
            >
              Compte Super Admin initial configuré en local.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VUE TABLEAU DE BORD AUTHENTIFIÉ
  return (
    <div style={{ padding: "40px 0 80px 0" }}>
      <div className="container">
        {/* En-tête profil */}
        <div
          className="glass-card"
          style={{
            padding: "24px 32px",
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 style={{ fontSize: "1.5rem" }}>{user.fullName}</h2>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  background: user.isSuperAdmin ? "rgba(245, 166, 35, 0.2)" : "rgba(0, 180, 216, 0.2)",
                  color: user.isSuperAdmin ? "var(--gold)" : "var(--cyan)",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                }}
              >
                {user.roleName}
              </span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              {user.email} • {user.hubLocation || "Bureau Central"}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.85rem", gap: "6px" }}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>

        {/* Navigation par Onglets */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "28px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("shipments")}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "shipments" ? "2px solid var(--gold)" : "2px solid transparent",
              color: activeTab === "shipments" ? "var(--gold)" : "var(--text-muted)",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Package size={18} />
            Dossiers & Expéditions
          </button>

          {user.isSuperAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("roles")}
                style={{
                  padding: "10px 18px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "roles" ? "2px solid var(--gold)" : "2px solid transparent",
                  color: activeTab === "roles" ? "var(--gold)" : "var(--text-muted)",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Sliders size={18} />
                Rôles & Permissions
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                style={{
                  padding: "10px 18px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "users" ? "2px solid var(--gold)" : "2px solid transparent",
                  color: activeTab === "users" ? "var(--gold)" : "var(--text-muted)",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Users size={18} />
                Collaborateurs
              </button>
            </>
          )}
        </div>

        {/* CONTENU ONGLET 1 : EXPÉDITIONS */}
        {activeTab === "shipments" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", flex: "1 1 300px" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Rechercher par n° suivi, client, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={loadShipments}
                  className="btn btn-secondary"
                  style={{ padding: "0 16px" }}
                >
                  <Search size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateShipmentModal(true)}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Nouveau Dossier
              </button>
            </div>

            <div className="glass-card" style={{ padding: "20px", overflowX: "auto" }}>
              {shipmentsLoading ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <RefreshCw size={24} style={{ animation: "spin 1.5s linear infinite" }} />
                </div>
              ) : shipments.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  Aucune expédition enregistrée pour le moment.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                      <th style={{ padding: "12px 8px" }}>Numéro Suivi</th>
                      <th style={{ padding: "12px 8px" }}>Client</th>
                      <th style={{ padding: "12px 8px" }}>Liaison</th>
                      <th style={{ padding: "12px 8px" }}>Colis / Poids</th>
                      <th style={{ padding: "12px 8px" }}>Statut Actuel</th>
                      <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "14px 8px" }}>
                          <Link
                            href={`/tracking/${s.tracking_number}`}
                            target="_blank"
                            style={{ fontWeight: "700", color: "var(--gold)", textDecoration: "underline" }}
                          >
                            {s.tracking_number}
                          </Link>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                            {new Date(s.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <div style={{ fontWeight: "600" }}>{s.client_name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.client_phone}</div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <div>{s.origin_country} → {s.destination_country}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--cyan)" }}>{s.shipping_mode_name}</div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <strong>{s.total_parcels_count} colis</strong>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.total_weight_kg} kg</div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <span className="status-badge status-hub">
                            {s.status_label}
                          </span>
                        </td>
                        <td style={{ padding: "14px 8px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowStatusModal(s);
                              setStatusUpdate({
                                new_status: s.current_status,
                                location: user.hubLocation || "Entrepôt",
                                comment: "",
                              });
                            }}
                            className="btn btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          >
                            Changer Statut
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : RÔLES DYNAMIQUES (Super Admin) */}
        {activeTab === "roles" && user.isSuperAdmin && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.4rem" }}>Rôles & Matrice des Autorisations</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Définissez précisément les permissions et statuts autorisés pour chaque poste opérationnel.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateRoleModal(true)}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Créer un Rôle
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {roles.map((r) => (
                <div key={r.id} className="glass-card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h4 style={{ fontSize: "1.2rem" }}>{r.name}</h4>
                        {r.is_system === 1 && (
                          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "var(--radius-full)", background: "rgba(245, 166, 35, 0.2)", color: "var(--gold)" }}>
                            SYSTÈME
                          </span>
                        )}
                      </div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "4px" }}>
                        {r.description || "Aucune description"}
                      </p>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                      {r.users_count} collaborateur(s)
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "8px" }}>
                      Permissions accordées ({r.permissions.length}) :
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {r.is_system === 1 ? (
                        <span className="status-badge status-hub">Accès Intégral (*)</span>
                      ) : (
                        r.permissions.map((p: string) => (
                          <span key={p} style={{ fontSize: "0.75rem", padding: "4px 8px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", color: "var(--cyan)" }}>
                            {p}
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

        {/* CONTENU ONGLET 3 : UTILISATEURS (Super Admin) */}
        {activeTab === "users" && user.isSuperAdmin && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.4rem" }}>Collaborateurs & Opérateurs</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Gestion des accès et affectation aux hubs (Chine, Dubaï, Afrique).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Ajouter un Collaborateur
              </button>
            </div>

            <div className="glass-card" style={{ padding: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                    <th style={{ padding: "12px 8px" }}>Nom</th>
                    <th style={{ padding: "12px 8px" }}>Email</th>
                    <th style={{ padding: "12px 8px" }}>Rôle</th>
                    <th style={{ padding: "12px 8px" }}>Localisation</th>
                    <th style={{ padding: "12px 8px" }}>État</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                      <td style={{ padding: "12px 8px", fontWeight: "600" }}>{u.full_name}</td>
                      <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>{u.email}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ padding: "3px 8px", background: "rgba(245, 166, 35, 0.15)", color: "var(--gold)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
                          {u.role_name}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--cyan)" }}>{u.hub_location || "—"}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ color: u.is_active === 1 ? "var(--emerald)" : "var(--rose)", fontWeight: "600" }}>
                          {u.is_active === 1 ? "Actif" : "Désactivé"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODALE CRÉATION D'EXPÉDITION */}
        {showCreateShipmentModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: "20px",
            }}
          >
            <div className="glass-card" style={{ maxWidth: "600px", width: "100%", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "20px" }}>Nouveau Dossier d&apos;Expédition</h3>

              <form onSubmit={handleCreateShipment} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Nom du Destinataire / Client
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newShipment.client_name}
                    onChange={(e) => setNewShipment({ ...newShipment, client_name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Téléphone WhatsApp (+indicatif)
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newShipment.client_phone}
                      onChange={(e) => setNewShipment({ ...newShipment, client_phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Pays de Destination
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newShipment.client_country}
                      onChange={(e) => setNewShipment({ ...newShipment, client_country: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Liaison / Route
                    </label>
                    <select
                      className="input-field"
                      value={newShipment.route_id}
                      onChange={(e) => setNewShipment({ ...newShipment, route_id: e.target.value })}
                    >
                      <option value="route-cn-ml">Chine (Guangzhou) → Mali (Bamako)</option>
                      <option value="route-ae-ci">Dubaï → Côte d&apos;Ivoire (Abidjan)</option>
                      <option value="route-ma-sn">Maroc (Casablanca) → Sénégal (Dakar)</option>
                      <option value="route-cn-gn">Chine (Guangzhou) → Guinée (Conakry)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Mode de Transport
                    </label>
                    <select
                      className="input-field"
                      value={newShipment.shipping_mode_id}
                      onChange={(e) => setNewShipment({ ...newShipment, shipping_mode_id: e.target.value })}
                    >
                      <option value="AIR_EXPRESS">Aérien Express (3-5 jours)</option>
                      <option value="AIR_STANDARD">Aérien Standard (7-10 jours)</option>
                      <option value="SEA_LCL">Maritime Groupage LCL</option>
                      <option value="ROAD_STANDARD">Terrestre Transfrontalier</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Étiquette Colis
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newShipment.package_label}
                      onChange={(e) => setNewShipment({ ...newShipment, package_label: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      className="input-field"
                      value={newShipment.weight_kg}
                      onChange={(e) => setNewShipment({ ...newShipment, weight_kg: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateShipmentModal(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Enregistrer & Générer le Tracking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE MISE À JOUR DE STATUT */}
        {showStatusModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: "20px",
            }}
          >
            <div className="glass-card" style={{ maxWidth: "480px", width: "100%", padding: "32px" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>
                Mettre à jour le statut
              </h3>
              <p style={{ color: "var(--gold)", fontWeight: "700", marginBottom: "20px" }}>
                {showStatusModal.tracking_number}
              </p>

              <form onSubmit={handleUpdateStatus} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Nouveau Statut
                  </label>
                  <select
                    className="input-field"
                    value={statusUpdate.new_status}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, new_status: e.target.value })}
                  >
                    <option value="RECEIVED_AT_HUB">Reçu à l&apos;entrepôt</option>
                    <option value="PACKED_READY">Prêt pour expédition</option>
                    <option value="IN_TRANSIT">En cours d&apos;acheminement</option>
                    <option value="CUSTOMS_HOLD">Dédouanement en cours</option>
                    <option value="ARRIVED_DESTINATION">Arrivé à destination</option>
                    <option value="READY_FOR_PICKUP">Disponible au retrait</option>
                    <option value="OUT_FOR_DELIVERY">En cours de livraison</option>
                    <option value="DELIVERED">Livré</option>
                    <option value="INCIDENT">Attention requise (Incident)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Lieu Actuel
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={statusUpdate.location}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, location: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Commentaire public
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Vol CZ305 décollé / En douane à l'aéroport"
                    value={statusUpdate.comment}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(null)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Valider le Statut
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE CRÉATION DE RÔLE DYNAMIQUE */}
        {showCreateRoleModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: "20px",
            }}
          >
            <div className="glass-card" style={{ maxWidth: "560px", width: "100%", padding: "32px", maxHeight: "85vh", overflowY: "auto" }}>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "6px" }}>Créer un Rôle Personnalisé</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                En tant que Super Admin, vous décidez des permissions attribuées à ce rôle.
              </p>

              <form onSubmit={handleCreateRole} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Nom du Rôle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Agent Hub Guangzhou"
                    className="input-field"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Responsable de la réception et pesée des colis"
                    className="input-field"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--gold)", display: "block", marginBottom: "8px", fontWeight: "700" }}>
                    Permissions Cocher
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "160px", overflowY: "auto", padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-sm)" }}>
                    {allPermissions.map((p) => {
                      const checked = newRole.permissions.includes(p.code);
                      return (
                        <label key={p.code} style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRole({ ...newRole, permissions: [...newRole.permissions, p.code] });
                              } else {
                                setNewRole({ ...newRole, permissions: newRole.permissions.filter((x) => x !== p.code) });
                              }
                            }}
                          />
                          {p.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--cyan)", display: "block", marginBottom: "8px", fontWeight: "700" }}>
                    Statuts d'expédition autorisés pour ce rôle
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "140px", overflowY: "auto", padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-sm)" }}>
                    {allStatuses.map((s) => {
                      const checked = newRole.allowed_statuses.includes(s.code);
                      return (
                        <label key={s.code} style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRole({ ...newRole, allowed_statuses: [...newRole.allowed_statuses, s.code] });
                              } else {
                                setNewRole({ ...newRole, allowed_statuses: newRole.allowed_statuses.filter((x) => x !== s.code) });
                              }
                            }}
                          />
                          {s.label_public}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowCreateRoleModal(false)} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Créer le Rôle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE CRÉATION UTILISATEUR */}
        {showCreateUserModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: "20px",
            }}
          >
            <div className="glass-card" style={{ maxWidth: "480px", width: "100%", padding: "32px" }}>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>Ajouter un Collaborateur</h3>

              <form onSubmit={handleCreateUser} style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Mot de passe initial
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="input-field"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Rôle attribué
                    </label>
                    <select
                      className="input-field"
                      value={newUser.role_id}
                      onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                      Hub / Localisation
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newUser.hub_location}
                      onChange={(e) => setNewUser({ ...newUser, hub_location: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowCreateUserModal(false)} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
