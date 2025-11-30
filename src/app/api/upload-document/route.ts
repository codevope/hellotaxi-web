import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { DocumentName } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const driverId = formData.get('driverId') as string;
    const documentName = formData.get('documentName') as DocumentName;

    if (!file || !driverId || !documentName) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo imágenes y PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) y PDF' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Tamaño máximo: 5MB' },
        { status: 400 }
      );
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${documentName}_${timestamp}.${extension}`;

    // Crear referencia en Firebase Storage
    // Estructura: drivers/{driverId}/documents/{documentName}/{filename}
    const storageRef = ref(storage, `drivers/${driverId}/documents/${documentName}/${filename}`);

    // Configurar metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        driverId: driverId,
        documentType: documentName,
        uploadedAt: new Date().toISOString(),
      }
    };

    // Subir archivo a Firebase Storage
    await uploadBytes(storageRef, buffer, metadata);

    // Obtener URL de descarga pública
    const documentUrl = await getDownloadURL(storageRef);

    // Actualizar Firestore con la URL del documento
    const driverRef = doc(db, 'drivers', driverId);
    const updateData: any = {
      [`documentUrls.${documentName}`]: documentUrl,
      [`documentStatus.${documentName}`]: 'pending'
    };

    try {
      await updateDoc(driverRef, updateData);
    } catch (firestoreError) {
      console.error('Error updating Firestore:', firestoreError);
      return NextResponse.json(
        { error: 'Archivo subido pero no se pudo actualizar la base de datos', details: firestoreError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: documentUrl,
      message: 'Documento subido exitosamente a Firebase Storage'
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Error al subir el documento', details: errorMessage },
      { status: 500 }
    );
  }
}
