import type { Team } from "@/types/team";

const CLUB_OPTIONS = [
  { name: "Arsenal", color: "#EF0107", logoBg: "EF0107" },
  { name: "Barcelona", color: "#A50044", logoBg: "A50044" },
  { name: "Real Madrid", color: "#FEBE10", logoBg: "1A5276" },
  { name: "Manchester City", color: "#6CABDD", logoBg: "6CABDD" },
  { name: "Liverpool", color: "#C8102E", logoBg: "C8102E" },
  { name: "Chelsea", color: "#034694", logoBg: "034694" },
  { name: "Bayern Munich", color: "#DC052D", logoBg: "DC052D" },
  { name: "PSG", color: "#004170", logoBg: "004170" },
  { name: "Inter Milan", color: "#0068A8", logoBg: "0068A8" },
  { name: "Juventus", color: "#000000", logoBg: "333333" },
  { name: "AC Milan", color: "#FB090B", logoBg: "FB090B" },
  { name: "Atletico Madrid", color: "#CB3524", logoBg: "CB3524" },
] as const;

const logo = (name: string, bg: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0, 3))}&background=${bg}&color=fff&size=128&bold=true&format=png`;

export function createAuctionTeams(
  count: number,
  startingBudget: number,
  maxSquadSize: number,
  auctionId?: string
): Team[] {
  const teamCount = Math.max(2, Math.min(count, 20));
  return Array.from({ length: teamCount }, (_, index) => {
    const club = CLUB_OPTIONS[index] ?? {
      name: `Team ${index + 1}`,
      color: "#6B7280",
      logoBg: "374151",
    };
    return {
      id: auctionId ? `${auctionId}-t${index + 1}` : `team-${index + 1}`,
      auctionId,
      name: `Team ${index + 1}`,
      logo: logo(club.name, club.logoBg),
      color: club.color,
      budget: startingBudget,
      spent: 0,
      squad: [],
      maxSquadSize,
      isAvailable: true,
    };
  });
}

export { CLUB_OPTIONS };
