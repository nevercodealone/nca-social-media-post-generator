import { GLOBAL_PROMPT_HELPERS } from "./prompts.js";

type ChatPlatform = "youtube" | "linkedin" | "twitter" | "instagram" | "tiktok";

interface PlatformMessageOptions {
  videoDuration?: string;
}

export class ChatPrompts {
  static createInitialMessage(transcript: string): string {
    return `Du bist ein Social-Media-Content-Optimierungsassistent für Entwickler-Content im Jahr 2025.

${GLOBAL_PROMPT_HELPERS.BRAND_NAMES}

${GLOBAL_PROMPT_HELPERS.AVOID_EXAGGERATION}

${GLOBAL_PROMPT_HELPERS.INFORMAL_ADDRESS}

Hier ist das Transkript eines Videos. Es enthält Erkennungsfehler aus der Sprache-zu-Text-Umwandlung.

Transkript:
${transcript}

Deine ERSTE Aufgabe:
1. Erstelle eine korrigierte Version des Transkripts mit AUSSCHLIESSLICH korrigierter Interpunktion (Kommas, Punkte) und korrekter Schreibweise der Marken und Begriffe aus dem Brandnames-Hinweis. KEINE weiteren Änderungen an Wörtern oder Satzbau!
2. Extrahiere 3 SEO-Keywords (jeweils max. 2-3 Wörter, KEINE Nummerierung).

Korrektur-Hinweise:
- "Clothe", "clode", "clot" ersetze mit "Claude"
- "Superlo", "Superclo", "Superclode" ersetze mit "SuperClaude"
- "PAP", "PP" ersetze mit "PHP"
- "Sulo", "Solu" ersetze mit "Sulu"
- Wenn Transkript auf Englisch ist, bleibe auf Englisch

Formatiere so:

TRANSCRIPT:
[korrigierter Transkripttext]

KEYWORDS:
keyword1
keyword2
keyword3`;
  }

  static createPlatformMessage(platform: ChatPlatform, options: PlatformMessageOptions = {}): string {
    switch (platform) {
      case "youtube":
        return this.youtubeMessage(options.videoDuration);
      case "linkedin":
        return this.linkedinMessage();
      case "twitter":
        return this.twitterMessage();
      case "instagram":
        return this.instagramMessage();
      case "tiktok":
        return this.tiktokMessage();
    }
  }

  private static youtubeMessage(videoDuration?: string): string {
    const timestamps = videoDuration
      ? `
3. GENAU 5 Zeitstempel (erster 0:00, letzter ${videoDuration}, gleichmäßig verteilt, Topics aus dem Transkript)

TIMESTAMPS:
[5 Zeitstempel im Format "0:00 Topic-Name"]`
      : "";

    return `Erstelle jetzt YouTube-Content basierend auf dem korrigierten Transkript und den Keywords:

1. SEO-optimierten Titel (60-70 Zeichen, Keyword am Anfang)
2. Sehr lange Beschreibung (ca. 1500 Zeichen, GENAU 3 ausführliche Absätze à 8-10 Sätze)${timestamps ? "\n" + timestamps.split("\n")[1] : ""}

Titel: Keyword am Anfang. VERBOTEN: "Meine Meinung zu...", negative Clickbait, (), &, #, !. Statt "&" immer "und"/"+" schreiben. Nie "Im Short zeige ich"/"Im Video". Ich-Perspektive. Englisch wenn Transkript englisch.

Beschreibung: Für Entwickler. Absatz 1: These mit Hauptkeyword am Anfang. Absatz 2: Argumente aus dem Transkript. Absatz 3: Community-Diskussion. NUR Inhalte aus dem Transkript, NICHTS erfinden.

TITLE:
[YouTube-Titel]

DESCRIPTION:
[3 Absätze]${timestamps}`;
  }

  private static linkedinMessage(): string {
    return `Erstelle jetzt einen LinkedIn-Post basierend auf dem korrigierten Transkript und den Keywords:

- 1000-1500 Zeichen, mit Absätzen
- Zielgruppe: Follower und Entscheider
- Ton: Spaß an Themen, helfe in Demos und Remote Workshops
- KEINE EMOJIS
- Keywords prominent integrieren
- Abschluss: Motivierende Frage
- 3-5 Hashtags am Ende
- NUR passende Tools/Technologien

LINKEDIN POST:
[LinkedIn-Post mit Hashtags]`;
  }

  private static twitterMessage(): string {
    return `Erstelle jetzt einen Twitter-Post basierend auf dem korrigierten Transkript:

- Max 280 Zeichen inkl. Hashtags
- Meinungsstark, diskussionsfördernd
- KEINE Emojis
- 1-2 Hashtags

TWITTER POST:
[Max 280 Zeichen]`;
  }

  private static instagramMessage(): string {
    return `Erstelle jetzt einen Instagram-Post basierend auf dem korrigierten Transkript:

- 500-800 Zeichen
- Persönlich, kurze Absätze
- KEINE Emojis
- GENAU 10 Hashtags: erste 3 MÜSSEN #nca #duisburg #ncatestify sein, 7 themenspezifisch

INSTAGRAM POST:
[Post mit 10 Hashtags]`;
  }

  private static tiktokMessage(): string {
    return `Erstelle jetzt einen TikTok-Post basierend auf dem korrigierten Transkript und den Keywords:

- 150-300 Zeichen (ohne Hashtags)
- Starker Hook in den ersten 10-15 Wörtern
- KEINE Emojis
- 3-6 Hashtags (deutsch + englisch Mix)

TIKTOK POST:
[Post mit Hashtags]`;
  }
}
