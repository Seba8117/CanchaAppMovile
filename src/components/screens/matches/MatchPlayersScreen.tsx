import { ArrowLeft, Star, AlertTriangle, Users, Shield, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { useEffect, useRef, useState } from 'react';
import { db } from '../../../Firebase/firebaseConfig';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';

interface MatchPlayersScreenProps {
  match: any;
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
  userType: 'player' | 'owner';
}

export function MatchPlayersScreen({ match, onBack, onNavigate, userType }: MatchPlayersScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(50);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const startTs = useRef<number>(performance.now());

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setError(null);
        const ids: string[] = Array.isArray(match?.players) ? match.players : [];
        if (ids.length === 0) {
          setPlayers([]);
          return;
        }
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
        const results: any[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'jugador'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.docs.forEach(d => results.push({ id: d.id, ...d.data() }));
        }
        setPlayers(results);
      } catch (err: any) {
        setError('No se pudieron cargar los jugadores.');
      } finally {
        setLoading(false);
        const duration = performance.now() - startTs.current;
        console.log(`[MatchPlayersScreen] loaded in ${Math.round(duration)}ms, players=${players.length}`);
      }
    };
    loadPlayers();
  }, [match?.id]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setVisibleCount((c) => c + 50);
      }
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef.current]);

  const handleReportPlayer = (player: any) => {
    onNavigate('report-player', { player, match });
  };

  const renderPlayerCard = (player: any, isMyTeam: boolean) => (
    <Card key={player.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarFallback className={`${isMyTeam ? 'bg-[#00a884]' : 'bg-[#172c44]'} text-white`}>
                {(player.displayName || player.name || player.email || 'US')[0]}
              </AvatarFallback>
            </Avatar>
            {player.isCaptain && (
              <div className="absolute -top-1 -right-1 bg-[#f4b400] rounded-full p-1">
                <Shield size={12} className="text-[#172c44]" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[#172c44]">{player.displayName || player.name || player.email || 'Usuario'}</p>
              {player.isCaptain && (
                <Badge variant="outline" className="text-xs border-[#f4b400] text-[#f4b400]">
                  Capitán
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{player.favoritePosition || 'Jugador'}</p>
            <div className="flex items-center gap-1">
              <Star className="text-[#f4b400]" size={12} fill="currentColor" />
              <span className="text-xs text-gray-600">{player.rating || '4.5'}</span>
            </div>
          </div>
          {userType === 'player' && !isMyTeam && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReportPlayer(player)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <AlertTriangle size={14} className="mr-1" />
              Reportar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="text-[#172c44]" size={24} />
          </button>
          <h1 className="text-[#172c44]">Jugadores del Partido</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 pb-6">
        {/* Match Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-[#f4b400] text-[#172c44] mb-2">
                  {String(match?.sport || 'Deporte')}
                </Badge>
                <CardTitle className="text-[#172c44] text-lg">{typeof match?.location === 'object' ? match?.location?.address || 'Ubicación no especificada' : String(match?.location || 'Ubicación no especificada')}</CardTitle>
                <p className="text-sm text-gray-600">{(match?.date?.toDate ? match.date.toDate().toLocaleDateString() : String(match?.date || 'Fecha'))} • {String(match?.time || 'Hora')}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-[#00a884]">
                  <Users size={16} />
                  <span>{players.length} jugadores</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Players Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00a884] rounded-full"></div>
              Todos ({players.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-0">
            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/40 h-16 rounded-md" />
                ))}
              </div>
            )}
            {!loading && error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {!loading && !error && players.slice(0, visibleCount).map((player) => renderPlayerCard(player, true))}
            <div ref={sentinelRef} />
          </TabsContent>
        </Tabs>

        {userType === 'player' && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-600 mt-1" size={20} />
                <div>
                  <h4 className="text-orange-800 mb-1">Código de Conducta</h4>
                  <p className="text-sm text-orange-700">
                    Mantén el respeto y fair play. Reporta cualquier comportamiento inadecuado 
                    para mantener una comunidad deportiva sana.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
