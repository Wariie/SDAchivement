// Shared modal styles to reduce inline object recreation
export const modalStyles = {
  container: {
    padding: "0",
    margin: "-16px -16px 0 -16px"
  },

  heroImageBanner: {
    position: "relative" as const,
    height: "120px",
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    borderRadius: "0",
    overflow: "hidden" as const,
    marginBottom: "16px"
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    opacity: 0.8
  },

  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)"
  },

  titleSection: {
    position: "absolute" as const,
    bottom: "10px",
    left: "15px",
    right: "15px",
    color: "white"
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px"
  },

  gameTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold" as const,
    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
    flex: 1,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const
  },

  statsContainer: {
    padding: "0 16px 8px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "15px"
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "12px",
    borderRadius: "6px",
    textAlign: "center" as const
  },

  statValue: {
    fontSize: "20px",
    fontWeight: "bold" as const
  },

  statLabel: {
    fontSize: "11px",
    opacity: 0.7
  }
} as const;