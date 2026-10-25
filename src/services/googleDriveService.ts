import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Google Auth Provider with Google Drive Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive');

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveBackupFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

// Initialize Auth listener
export const initGoogleAuth = (
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn && onFailure) {
        onFailure();
      }
    }
  });
};

// Sign in with Google Popup
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không thể lấy Access Token từ tài khoản Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.error('Google Sign-in failed:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

// Sign out
export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Get current access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Get or create dedicated backup folder on Google Drive
export const getOrCreateBackupFolder = async (
  folderName: string = 'HRM Enterprise - Sao Lưu Bảng Lương & Hợp Đồng'
): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập tài khoản Google Drive.');

  // Check if folder exists
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Lỗi tìm thư mục Drive: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Thư mục tự động sao lưu bảng lương, chấm công và hồ sơ hợp đồng nhân sự HRM Enterprise.',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Lỗi tạo thư mục trên Google Drive: ${createRes.statusText}`);
  }

  const folder = await createRes.json();
  return folder.id;
};

// Upload or create a file with content in Google Drive multipart
export const uploadFileToDrive = async (
  fileName: string,
  content: string,
  mimeType: string = 'application/json',
  folderId?: string
): Promise<DriveBackupFile> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập tài khoản Google Drive.');

  const targetFolderId = folderId || (await getOrCreateBackupFolder());

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [targetFolderId],
    description: `Bản sao lưu tự động tạo lúc ${new Date().toLocaleString('vi-VN')}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,size,webViewLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.error?.message || `Lỗi tải file lên Drive: ${res.statusText}`
    );
  }

  return await res.json();
};

// List backed up files in the HRM folder
export const listBackupFiles = async (folderId?: string): Promise<DriveBackupFile[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const targetFolderId = folderId || (await getOrCreateBackupFolder());
    const query = `'${targetFolderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&orderBy=createdTime desc&pageSize=25&fields=files(id,name,mimeType,createdTime,size,webViewLink)`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn('Could not list Drive files:', err);
    return [];
  }
};
