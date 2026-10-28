import { db, auth } from './firebase';
import { doc, onSnapshot, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, query, where, limit, startAfter, orderBy } from 'firebase/firestore';
import { ReturnRequest } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  
  // Do not throw for read operations to prevent unhandled asynchronous crashes in React.
  if (operationType === OperationType.GET || operationType === OperationType.LIST) {
    return;
  }
  
  throw new Error(errInfo.error);
}

export const syncData = async (userId: string, collectionName: string, data: any) => {
  const path = `users/${userId}/data/${collectionName}`;
  try {
    const docRef = doc(db, 'users', userId, 'data', collectionName);
    await setDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeData = (userId: string, collectionName: string, callback: (data: any) => void) => {
  const path = `users/${userId}/data/${collectionName}`;
  const docRef = doc(db, 'users', userId, 'data', collectionName);
  return onSnapshot(
    docRef, 
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const addOrder = async (userId: string, order: any) => {
  const path = `users/${userId}/orders`;
  try {
    const colRef = collection(db, 'users', userId, 'orders');
    return await addDoc(colRef, order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getOrders = async (userId: string) => {
  const path = `users/${userId}/orders`;
  try {
    const colRef = collection(db, 'users', userId, 'orders');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

// Global Products CRUD operations
export const subscribeProducts = (callback: (products: any[]) => void) => {
  const path = 'products';
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef, 
    (snapshot) => {
      const products: any[] = [];
      snapshot.forEach((doc) => {
        if (!doc.id.toLowerCase().startsWith('sc-')) {
          products.push({ id: doc.id, ...doc.data() });
        }
      });
      callback(products);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

// Paginated Products
export const getProductsPaginated = async (lastVisible: any, pageSize: number) => {
  const path = 'products';
  try {
    const colRef = collection(db, 'products');
    let q = query(colRef, limit(pageSize));
    if (lastVisible) {
      q = query(colRef, startAfter(lastVisible), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { products, lastVisible: lastVisibleDoc };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

// Paginated Global Orders
export const getOrdersPaginated = async (lastVisible: any, pageSize: number) => {
  const path = 'global_orders';
  try {
    const colRef = collection(db, 'global_orders');
    let q = query(colRef, orderBy('id', 'desc'), limit(pageSize));
    if (lastVisible) {
      q = query(colRef, orderBy('id', 'desc'), startAfter(lastVisible), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
    const orders = snapshot.docs.map(doc => doc.data());
    return { orders, lastVisible: lastVisibleDoc };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const saveProduct = async (product: any) => {
  const path = `products/${product.id}`;
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteProduct = async (productId: string) => {
  const path = `products/${productId}`;
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const seedProducts = async (defaultProducts: any[]) => {
  const path = 'products';
  try {
    const colRef = collection(db, 'products');
    const snapshot = await getDocs(colRef);
    for (const d of snapshot.docs) {
      if (d.id.toLowerCase().startsWith('sc-')) {
        await deleteDoc(doc(db, 'products', d.id));
      }
    }
    const existingIds = new Set(snapshot.docs.map(d => d.id));
    for (const prod of defaultProducts) {
      if (!existingIds.has(prod.id)) {
        const docRef = doc(db, 'products', prod.id);
        await setDoc(docRef, { ...prod, adminPin: '990859' });
      }
    }
    if (false) {
      console.log('Seeding products collection in Firestore...');
      for (const prod of defaultProducts) {
        const docRef = doc(db, 'products', prod.id);
        await setDoc(docRef, { ...prod, adminPin: '990859' });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Global Admin Orders management
export const saveGlobalOrder = async (order: any) => {
  const path = `global_orders/${order.id}`;
  try {
    const docRef = doc(db, 'global_orders', order.id);
    await setDoc(docRef, order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeGlobalOrders = (callback: (orders: any[]) => void) => {
  const path = 'global_orders';
  const colRef = collection(db, 'global_orders');
  return onSnapshot(
    colRef, 
    (snapshot) => {
      const orders: any[] = [];
      snapshot.forEach((doc) => {
        orders.push(doc.data());
      });
      callback(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

// Global Return/Exchange Requests management
export const saveReturnRequest = async (request: any) => {
  const path = `return_requests/${request.id}`;
  try {
    const docRef = doc(db, 'return_requests', request.id);
    await setDoc(docRef, request);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeReturnRequests = (callback: (requests: ReturnRequest[]) => void) => {
  const path = 'return_requests';
  const colRef = collection(db, 'return_requests');
  return onSnapshot(
    colRef, 
    (snapshot) => {
      const requests: ReturnRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push(doc.data() as ReturnRequest);
      });
      callback(requests);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const getReturnRequestsByOrder = async (orderId: string, email?: string): Promise<ReturnRequest[]> => {
  const path = 'return_requests';
  try {
    const colRef = collection(db, 'return_requests');
    const q = query(colRef, where('orderId', '==', orderId.toUpperCase().trim()));
    const snapshot = await getDocs(q);
    const results: ReturnRequest[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data() as ReturnRequest;
      if (!email || data.email.toLowerCase().trim() === email.toLowerCase().trim()) {
        results.push(data);
      }
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

// Global Hero section customization settings management
export const subscribeHeroSettings = (callback: (settings: any) => void) => {
  const path = 'settings/hero';
  const docRef = doc(db, 'settings', 'hero');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data(); if (data?.heroSubtitle && data.heroSubtitle.toLowerCase().includes('women')) { callback(null); } else { callback(data); }
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const saveHeroSettings = async (settings: any) => {
  const path = 'settings/hero';
  try {
    const docRef = doc(db, 'settings', 'hero');
    await setDoc(docRef, settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};



