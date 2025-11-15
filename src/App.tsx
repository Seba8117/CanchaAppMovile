import { useState, useEffect } from "react";

// --- INICIO: Importaciones para la prueba de Firebase ---
import { db, auth } from "./Firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
// --- FIN: Importaciones para la prueba de Firebase ---

import { LoginScreen } from "./components/screens/auth/LoginScreen";
import { HomeScreen } from "./components/screens/home/HomeScreen";
import { MatchDetailScreen } from "./components/screens/matches/MatchDetailScreen";
import { CreateMatchScreen } from "./components/screens/matches/CreateMatchScreen";
import { AvailableMatchesScreen } from "./components/screens/matches/AvailableMatchesScreen";
import { JoinedMatchesScreen } from "./components/screens/matches/JoinedMatchesScreen";
import { SearchScreen } from "./components/screens/home/SearchScreen";
import { ProfileScreen } from "./components/screens/profile/ProfileScreen";
import { ChatScreen } from "./components/screens/home/ChatScreen";
import { NotificationsScreen } from "./components/screens/home/NotificationsScreen";
import { TournamentsScreen } from "./components/screens/tournaments/TournamentsScreen";
import { EditProfileScreen } from "./components/screens/profile/EditProfileScreen";
import { OwnerDashboard } from "./components/screens/owner/OwnerDashboard";
import { OwnerProfile } from "./components/screens/owner/OwnerProfile";
import { OwnerCourtsScreen } from "./components/screens/owner/OwnerCourtsScreen";
import { EditOwnerProfileScreen } from "./components/screens/owner/EditOwnerProfileScreen";
import { AddCourtScreen } from "./components/screens/owner/AddCourtScreen";
import { CreateTournamentScreen } from "./components/screens/tournaments/CreateTournamentScreen";
import { TournamentManagementScreen } from "./components/screens/tournaments/TournamentManagementScreen";
import { TeamDetailsScreen } from "./components/screens/teams/TeamDetailsScreen";
import { TournamentDetailScreen } from "./components/screens/tournaments/TournamentDetailScreen";
import { MatchPlayersScreen } from "./components/screens/matches/MatchPlayersScreen";
import { ReportPlayerScreen } from "./components/screens/profile/ReportPlayerScreen";
import { ReportTeamScreen } from "./components/screens/teams/ReportTeamScreen";
import { CreateTeamScreen } from "./components/screens/teams/CreateTeamScreen";
import { MyTeamsScreen } from "./components/screens/teams/MyTeamsScreen";
import { DeleteTeamScreen } from "./components/screens/teams/DeleteTeamScreen";
import { Navigation } from "./components/navigation/Navigation";
import { MyBookingsScreen } from "./components/screens/booking/MyBookingsScreen";
import { OwnerNavigation } from "./components/navigation/OwnerNavigation";

// --- 1. IMPORTACIÓN AÑADIDA ---
import { EditCourtScreen } from "./components/screens/owner/EditCourtScreen";


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<"player" | "owner">(
    "player",
  );
  const [currentScreen, setCurrentScreen] = useState("home");
  const [screenData, setScreenData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monitorear el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Estado de autenticación cambió:", user ? "Autenticado" : "No autenticado");
      setCurrentUser(user);
      
      if (user) {
        console.log("Usuario autenticado:", user.uid);
        console.log("Email:", user.email);
      } else {
        console.log("Usuario no autenticado");
        setIsLoggedIn(false);
        setError(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- CÓDIGO DE PRUEBA DE FIREBASE (DESHABILITADO) ---
  /*
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const verificarConexionFirebase = async () => {
        // ... (código de prueba comentado)
      };
      verificarConexionFirebase();
    }
  }, [isLoggedIn, currentUser]);
  */
  // --- FIN CÓDIGO DE PRUEBA ---

  const handleLogin = (type: "player" | "owner", user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setUserType(type);
    setCurrentScreen(type === "owner" ? "owner-dashboard" : "home");
    setError(null);
    console.log("Usuario logueado correctamente con Firebase Auth");
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log("Sesión cerrada en Firebase Auth");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
    
    setIsLoggedIn(false);
    setUserType("player");
    setCurrentScreen("home");
    setScreenData(null);
    setCurrentUser(null);
  };

  const handleNavigate = (screen: string, data?: any) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const handleBack = () => {
    setCurrentScreen(
      userType === "owner" ? "owner-dashboard" : "home",
    );
    setScreenData(null);
  };

  if (!isLoggedIn) {
    return (
      <div>
        <LoginScreen onLogin={handleLogin} />
        {error && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: 1000
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  const renderScreen = () => {
    // Common screens for both user types
    switch (currentScreen) {
      case "tournaments":
        return (
          <TournamentsScreen
            onBack={handleBack}
            onNavigate={handleNavigate}
            userType={userType}
          />
        );
      case "tournament-detail":
        return (
          <TournamentDetailScreen
            onBack={handleBack}
            tournament={screenData}
            userType={userType}
          />
        );
      case "match-players":
        return (
          <MatchPlayersScreen
            match={screenData}
            onBack={handleBack}
            onNavigate={handleNavigate}
            userType={userType}
          />
        );
      case "report-player":
        return (
          <ReportPlayerScreen
            playerData={screenData}
            onBack={handleBack}
          />
        );
      case "report-team":
        return (
          <ReportTeamScreen
            teamData={screenData}
            onBack={handleBack}
          />
        );
      case "notifications":
        return (
          <NotificationsScreen
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        );
      case "chat":
        return <ChatScreen onBack={handleBack} />;
      case "create-team":
        return (
          <CreateTeamScreen
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        );
      case "my-teams":
        return (
          <MyTeamsScreen
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        );
      case "team-details":
        return (
          <TeamDetailsScreen
            onBack={handleBack}
            teamData={screenData}
            onNavigate={handleNavigate}
          />
        );
      case "delete-team":
        return (
          <DeleteTeamScreen
            teamData={screenData}
            onBack={handleBack}
            onTeamDeleted={() => {
              setCurrentScreen("my-teams");
              setScreenData(null);
            }}
            currentUserId="1" // Cambiado a string para compatibilidad
          />
        );
      default:
        break;
    }

    // Player-specific screens
    if (userType === "player") {
      switch (currentScreen) {
        case "home":
          return <HomeScreen onNavigate={handleNavigate} />;
        case "match-detail":
          return (
            <MatchDetailScreen
              match={screenData}
              onBack={handleBack}
              onNavigate={handleNavigate}
              userType={userType}
            />
          );
        case "create":
          return <CreateMatchScreen onBack={handleBack} />;
        case "available-matches":
          return (
            <AvailableMatchesScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          );
        case "joined-matches":
          return (
            <JoinedMatchesScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          );
        case "search":
          return <SearchScreen onNavigate={handleNavigate} />;
        case "profile":
          return (
            <ProfileScreen
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        case "edit-profile":
          return <EditProfileScreen onBack={handleBack} />;
        case "my-bookings":
          return <MyBookingsScreen onBack={handleBack} />;
        default:
          return <HomeScreen onNavigate={handleNavigate} />;
      }
    }

    // Owner-specific screens
    if (userType === "owner") {
      switch (currentScreen) {
        case "owner-dashboard":
          return (
            <OwnerDashboard
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        case "owner-courts":
          return (
            <OwnerCourtsScreen onNavigate={handleNavigate} />
          );
        case "owner-profile":
          return (
            <OwnerProfile
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        case "edit-owner-profile":
          return <EditOwnerProfileScreen onBack={handleBack} />;
        case "add-court":
          return (
            <AddCourtScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          );
          
        // --- 2. BLOQUE 'CASE' AÑADIDO ---
        case "edit-court":
          return (
            <EditCourtScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              courtData={screenData} // Aquí le pasas los datos de la cancha
            />
          );
        // --- FIN DEL BLOQUE AÑADIDO ---

        case "create-tournament":
          return (
            <CreateTournamentScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          );
        case "tournament-management":
          return (
            <TournamentManagementScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              tournament={screenData}
            />
          );
        default:
          return (
            <OwnerDashboard
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
      }
    }

    // Fallback
    return userType === "owner" ? (
      <OwnerDashboard onNavigate={handleNavigate} />
    ) : (
      <HomeScreen onNavigate={handleNavigate} />
    );
  };

  const showNavigation = ![
    "match-detail",
    "notifications",
    "tournaments",
    "tournament-detail",
    "edit-profile",
    "edit-owner-profile",
    "add-court",
    "edit-court", // <-- También lo añadí aquí para ocultar el menú en la pantalla de edición
    "create-tournament",
    "tournament-management",
    "team-details",
    "match-players",
    "report-player",
    "report-team",
    "create-team",
    "delete-team",
    "my-bookings",
    "chat",
  ].includes(currentScreen);

  return (
    <div className="max-w-sm mx-auto min-h-screen relative overflow-hidden bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f4b400]/10 via-transparent to-[#172c44]/20"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#f4b400]/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#00a884]/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-[#172c44]/15 to-[#00a884]/15 rounded-full blur-3xl"></div>

      {/* Patrón de puntos sutil */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#f4b400] rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-16 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-[#f4b400] rounded-full animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 right-8 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-500"></div>
        <div className="absolute top-60 left-1/2 w-1 h-1 bg-[#f4b400] rounded-full animate-pulse animation-delay-1500"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">{renderScreen()}</div>

      {showNavigation && userType === "player" && (
        <Navigation
          activeTab={currentScreen}
          onTabChange={setCurrentScreen}
        />
      )}
      {showNavigation && userType === "owner" && (
        <OwnerNavigation
          activeTab={currentScreen}
          onTabChange={setCurrentScreen}
        />
      )}
    </div>
  );
}