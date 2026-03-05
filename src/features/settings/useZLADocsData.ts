import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../lib/db';
import { ZLADocument } from '../../types';

export function useZLADocsData() {
  const [documents, setDocuments] = useState<ZLADocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        const allDocs = await db.zla_documents.toArray();
        setDocuments(allDocs);
      } catch (error) {
        console.error("Failed to load documents:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const addDocument = async (doc: Omit<ZLADocument, 'id'>) => {
    const id = uuidv4();
    const newDoc = { ...doc, id };
    await db.zla_documents.add(newDoc);
    setDocuments(prev => [...prev, newDoc]);
  };

  const deleteDocument = async (id: string) => {
    await db.zla_documents.delete(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return { documents, isLoading, addDocument, deleteDocument };
}
