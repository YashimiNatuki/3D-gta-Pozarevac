// [AiChatBratina v10.0] - Google Docs Integration Engine (Workspace API)
import { getAccessToken } from './firebaseAuth';

export interface GoogleDocItem {
  documentId: string;
  title: string;
  body?: string;
  revisionId?: string;
}

/**
 * Creates a formatted Thug Report / Game Log Google Doc in the user's Google Drive.
 */
export const createGoogleDocGameLog = async (
  title: string,
  contentMarkdown: string
): Promise<{ documentId: string; title: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Potrebno je povezati Google nalog pre kreiranja Google Docs izveštaja.');

  // 1. Create empty Google Doc
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title || `Požarevac Underground - Yashime Hronika ${new Date().toLocaleDateString('sr-RS')}`,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Greška pri kreiranju Google Doc-a (${createRes.status}): ${errText}`);
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // 2. Insert initial text into Google Doc
  if (contentMarkdown && documentId) {
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: `${contentMarkdown}\n\n---\nGenerisano putem AiChatBratina v10.0 XP Master Codex\nKonglomerat Preduzeće™ | Požarevac Full Power`,
              },
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      console.warn('Doc created, but failed to insert initial text body:', await updateRes.text());
    }
  }

  return {
    documentId,
    title: doc.title,
  };
};

/**
 * Reads a Google Doc content by document ID.
 */
export const readGoogleDoc = async (documentId: string): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Potrebno je povezati Google nalog.');

  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Greška pri čitanju Google Doc dokumenta: ${errText}`);
  }

  const data = await res.json();
  let fullText = '';
  if (data.body && data.body.content) {
    for (const elem of data.body.content) {
      if (elem.paragraph && elem.paragraph.elements) {
        for (const part of elem.paragraph.elements) {
          if (part.textRun && part.textRun.content) {
            fullText += part.textRun.content;
          }
        }
      }
    }
  }

  return fullText;
};
