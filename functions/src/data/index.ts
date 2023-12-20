import { getFirestore } from "firebase-admin/firestore";
import { Collection } from "../types";

export const firestore = getFirestore();

export interface Presentation {
  title: string;
  slides: string[];
  thumbnail: string;
  created: number;
  updated: number;
  id: string;
}

export const resolveMissingPresentations = async (
  uid: string,
  presentationIds: string[]
) => {
  try {
    const presentations = await firestore
      .collection(Collection.Presentation)
      .where("uid", "==", uid)
      .get();

    const presentationIdsInDb = presentations.docs.map(
      presentation => presentation.id
    );

    const missingPresentations = presentationIds.filter(
      presentationId => !presentationIdsInDb.includes(presentationId)
    );

    return missingPresentations;
  } catch (error: any) {
    console.error(error.message);
    return [];
  }
};

export const insertSlides = async (
  uid: string,
  presenetations: Presentation[]
) => {
  try {
    presenetations.forEach(async presentation => {
      await firestore
        .collection(Collection.Presentation)
        .add({ ...presentation, uid });
    });
    return true;
  } catch (error: any) {
    console.error(error.message);
    return false;
  }
};
