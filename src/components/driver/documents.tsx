'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Upload, Car, User, Calendar, Eye, CheckCircle2, CalendarIcon, AlertCircle, Clock } from 'lucide-react';
import type { DocumentName, DocumentStatus, EnrichedDriver } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocumentStatus } from '@/lib/document-status';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DriverDocumentsProps {
    driver: EnrichedDriver;
    onUpdate: (updatedDriver: EnrichedDriver) => void;
}

const docNameMap: Record<DocumentName, string> = {
    license: 'Licencia de Conducir',
    insurance: 'SOAT / Póliza de Seguro',
    technicalReview: 'Revisión Técnica',
    backgroundCheck: 'Certificado de Antecedentes',
    dni: 'DNI (Documento Nacional)',
    propertyCard: 'Tarjeta de Propiedad',
};

const individualDocStatusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'outline' | 'destructive'; bgColor: string }> = {
    approved: { label: 'Aprobado', variant: 'default', bgColor: 'bg-white border-emerald-200' },
    pending: { label: 'Pendiente', variant: 'outline', bgColor: 'bg-white border-slate-200' },
    rejected: { label: 'Rechazado', variant: 'destructive', bgColor: 'bg-white border-red-200' },
};

const parseDateString = (dateString: string): Date => {
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return new Date(dateString);
};

export default function DriverDocuments({ driver, onUpdate }: DriverDocumentsProps) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState<DocumentName | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<DocumentName | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [registrationDate, setRegistrationDate] = useState<string>('');
    const [editDateDialogOpen, setEditDateDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<DocumentName | null>(null);
    const [isUpdatingDate, setIsUpdatingDate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleUploadClick = (docName: DocumentName) => {
        if (driver.documentsStatus === 'approved') {
            toast({
                variant: 'destructive',
                title: 'Documentos Aprobados',
                description: 'Tus documentos ya han sido aprobados. No puedes modificarlos en este momento.',
            });
            return;
        }

        setSelectedDoc(docName);
        setExpiryDate('');
        setRegistrationDate('');
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedDoc) return;

        setSelectedFile(file);
        
        if (selectedDoc === 'dni' && driver.dniExpiry) {
            setExpiryDate(driver.dniExpiry.split('T')[0]);
        } else if (selectedDoc === 'license' && driver.licenseExpiry) {
            setExpiryDate(driver.licenseExpiry.split('T')[0]);
        } else if (selectedDoc === 'backgroundCheck' && driver.backgroundCheckExpiry) {
            setExpiryDate(driver.backgroundCheckExpiry.split('T')[0]);
        }

        setUploadDialogOpen(true);
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile || !selectedDoc) return;

        setIsUploading(selectedDoc);
        setUploadDialogOpen(false);

        try {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(selectedFile.type)) {
                throw new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP)');
            }

            const maxSize = 5 * 1024 * 1024;
            if (selectedFile.size > maxSize) {
                throw new Error('El archivo es demasiado grande. Tamaño máximo: 5MB');
            }

            const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
            const { storage } = await import('@/lib/firebase');

            const timestamp = Date.now();
            const extension = selectedFile.name.split('.').pop();
            const filename = `${selectedDoc}_${timestamp}.${extension}`;
            const storageRef = ref(storage, `drivers/${driver.id}/documents/${selectedDoc}/${filename}`);

            await uploadBytes(storageRef, selectedFile, {
                contentType: selectedFile.type,
                customMetadata: {
                    driverId: driver.id,
                    documentType: selectedDoc,
                    uploadedAt: new Date().toISOString(),
                }
            });

            const documentUrl = await getDownloadURL(storageRef);

            const driverRef = doc(db, 'drivers', driver.id);
            const updates: any = {
                [`documentUrls.${selectedDoc}`]: documentUrl,
                [`documentStatus.${selectedDoc}`]: 'pending',
                documentsStatus: 'pending'
            };

            if (selectedDoc === 'dni' && expiryDate) {
                updates.dniExpiry = new Date(expiryDate).toISOString();
            } else if (selectedDoc === 'license' && expiryDate) {
                updates.licenseExpiry = new Date(expiryDate).toISOString();
            } else if (selectedDoc === 'backgroundCheck' && expiryDate) {
                updates.backgroundCheckExpiry = new Date(expiryDate).toISOString();
            }

            await updateDoc(driverRef, updates);

            const updatedDriver: EnrichedDriver = {
                ...driver,
                documentUrls: {
                    dni: driver.documentUrls?.dni || '',
                    license: driver.documentUrls?.license || '',
                    propertyCard: driver.documentUrls?.propertyCard || '',
                    insurance: driver.documentUrls?.insurance || '',
                    technicalReview: driver.documentUrls?.technicalReview || '',
                    backgroundCheck: driver.documentUrls?.backgroundCheck || '',
                    [selectedDoc]: documentUrl,
                },
                documentStatus: {
                    dni: driver.documentStatus?.dni || 'pending',
                    license: driver.documentStatus?.license || 'pending',
                    propertyCard: driver.documentStatus?.propertyCard || 'pending',
                    insurance: driver.documentStatus?.insurance || 'pending',
                    technicalReview: driver.documentStatus?.technicalReview || 'pending',
                    backgroundCheck: driver.documentStatus?.backgroundCheck || 'pending',
                    [selectedDoc]: 'pending' as DocumentStatus,
                },
                documentsStatus: 'pending' as const,
                ...(selectedDoc === 'dni' && expiryDate ? { dniExpiry: new Date(expiryDate).toISOString() } : {}),
                ...(selectedDoc === 'license' && expiryDate ? { licenseExpiry: new Date(expiryDate).toISOString() } : {}),
                ...(selectedDoc === 'backgroundCheck' && expiryDate ? { backgroundCheckExpiry: new Date(expiryDate).toISOString() } : {}),
                vehicle: driver.vehicle
            };

            onUpdate(updatedDriver);

            toast({
                title: '✓ Documento Subido',
                description: `Tu ${docNameMap[selectedDoc]} ha sido enviado para revisión.`,
            });

        } catch (error) {
            console.error('Error uploading document:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo subir el documento.',
            });
        } finally {
            setIsUploading(null);
            setSelectedDoc(null);
            setSelectedFile(null);
            setExpiryDate('');
            setRegistrationDate('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const getDateLabel = (docName: DocumentName): { label: string; isExpiry: boolean } => {
        if (docName === 'propertyCard') {
            return { label: 'Fecha de Registro', isExpiry: false };
        }
        return { label: 'Fecha de Vencimiento', isExpiry: true };
    };

    const needsDate = (docName: DocumentName): boolean => {
        return ['dni', 'license', 'backgroundCheck'].includes(docName);
    };

    const handleEditDateClick = (docName: DocumentName) => {
        if (driver.documentsStatus === 'approved') {
            toast({
                variant: 'destructive',
                title: 'Documentos Aprobados',
                description: 'Tus documentos ya han sido aprobados. No puedes modificarlos en este momento.',
            });
            return;
        }

        if (['insurance', 'technicalReview', 'propertyCard'].includes(docName)) {
            toast({
                variant: 'default',
                title: 'Fecha gestionada por el administrador',
                description: 'Las fechas de los documentos del vehículo son ingresadas por el administrador.',
            });
            return;
        }
        
        setEditingDoc(docName);
        
        if (docName === 'dni' && driver.dniExpiry) {
            setExpiryDate(driver.dniExpiry.split('T')[0]);
        } else if (docName === 'license' && driver.licenseExpiry) {
            setExpiryDate(driver.licenseExpiry.split('T')[0]);
        } else if (docName === 'backgroundCheck' && driver.backgroundCheckExpiry) {
            setExpiryDate(driver.backgroundCheckExpiry.split('T')[0]);
        }
        
        setEditDateDialogOpen(true);
    };

    const handleUpdateDate = async () => {
        if (!editingDoc) return;

        setIsUpdatingDate(true);

        try {
            const driverRef = doc(db, 'drivers', driver.id);
            const updates: any = {};

            if (editingDoc === 'dni' && expiryDate) {
                updates.dniExpiry = new Date(expiryDate).toISOString();
            } else if (editingDoc === 'license' && expiryDate) {
                updates.licenseExpiry = new Date(expiryDate).toISOString();
            } else if (editingDoc === 'backgroundCheck' && expiryDate) {
                updates.backgroundCheckExpiry = new Date(expiryDate).toISOString();
            }

            if (Object.keys(updates).length > 0) {
                await updateDoc(driverRef, updates);
            }

            const updatedDriver = {
                ...driver,
                ...(editingDoc === 'dni' && expiryDate ? { dniExpiry: new Date(expiryDate).toISOString() } : {}),
                ...(editingDoc === 'license' && expiryDate ? { licenseExpiry: new Date(expiryDate).toISOString() } : {}),
                ...(editingDoc === 'backgroundCheck' && expiryDate ? { backgroundCheckExpiry: new Date(expiryDate).toISOString() } : {}),
                vehicle: driver.vehicle
            };

            onUpdate(updatedDriver);

            toast({
                title: '✓ Fecha actualizada',
                description: `La fecha de ${docNameMap[editingDoc]} ha sido actualizada.`,
            });

            setEditDateDialogOpen(false);
            setEditingDoc(null);
            setExpiryDate('');
            setRegistrationDate('');
        } catch (error) {
            console.error('Error updating date:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo actualizar la fecha.',
            });
        } finally {
            setIsUpdatingDate(false);
        }
    };
    
    const personalDocuments: { name: DocumentName; label: string; expiryDate?: string }[] = [
        { name: 'dni', label: 'DNI', expiryDate: driver.dniExpiry },
        { name: 'license', label: 'Licencia de Conducir', expiryDate: driver.licenseExpiry },
        { name: 'backgroundCheck', label: 'Certificado de Antecedentes', expiryDate: driver.backgroundCheckExpiry },
    ];
    
    const vehicleDocuments: { name: DocumentName; label: string; expiryDate?: string, registrationDate?: string }[] = [
        { name: 'propertyCard', label: 'Tarjeta de Propiedad', registrationDate: driver.vehicle?.propertyCardRegistrationDate },
        { name: 'insurance', label: 'SOAT / Póliza de Seguro', expiryDate: driver.vehicle?.insuranceExpiry },
        { name: 'technicalReview', label: 'Revisión Técnica', expiryDate: driver.vehicle?.technicalReviewExpiry },
    ];
    
    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
            />

            {/* Dialog para confirmar subida con fechas */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Subir {selectedDoc && docNameMap[selectedDoc]}</DialogTitle>
                        <DialogDescription>
                            Por favor confirma la información del documento antes de subirlo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Archivo seleccionado</Label>
                            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm truncate">{selectedFile?.name}</span>
                            </div>
                        </div>
                        
                        {selectedDoc && needsDate(selectedDoc) && (
                            <div className="space-y-2">
                                <Label htmlFor="document-date" className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    {getDateLabel(selectedDoc).label}
                                </Label>
                                <Input
                                    id="document-date"
                                    type="date"
                                    value={getDateLabel(selectedDoc).isExpiry ? expiryDate : registrationDate}
                                    onChange={(e) => {
                                        if (getDateLabel(selectedDoc).isExpiry) {
                                            setExpiryDate(e.target.value);
                                        } else {
                                            setRegistrationDate(e.target.value);
                                        }
                                    }}
                                    required
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setUploadDialogOpen(false);
                                setSelectedFile(null);
                                setExpiryDate('');
                                setRegistrationDate('');
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmUpload}
                            disabled={
                                !selectedFile ||
                                (needsDate(selectedDoc!) && 
                                    (getDateLabel(selectedDoc!).isExpiry ? !expiryDate : !registrationDate))
                            }
                        >
                            Subir Documento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mis Documentos Personales</h2>
                        <p className="text-sm text-slate-600">Mantén tus documentos actualizados para poder recibir viajes</p>
                    </div>
                    <div className="grid gap-4">
                        {personalDocuments.map(({ name, label, expiryDate }, index) => {
                            const status = driver.documentStatus?.[name] || 'pending';
                            const documentUrl = driver.documentUrls?.[name];
                            const expiryInfo = expiryDate ? getDocumentStatus(expiryDate) : null;
                            
                            return (
                                <motion.div 
                                    key={name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.4 }}
                                >
                                    <div className={cn(
                                        "border rounded-lg p-5 transition-all hover:shadow-md",
                                        individualDocStatusConfig[status].bgColor
                                    )}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <User className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{label}</h3>
                                                    <Badge variant={individualDocStatusConfig[status].variant} className="text-xs mt-1">
                                                        {individualDocStatusConfig[status].label}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {expiryDate && (
                                            <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-2">
                                                {expiryInfo?.icon}
                                                <span className="text-xs text-slate-700">
                                                    {expiryInfo?.label} • Vence: <span className="font-semibold">{format(parseDateString(expiryDate), 'dd/MM/yyyy')}</span>
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            {expiryDate && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditDateClick(name)}
                                                    className="text-xs"
                                                >
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Editar fecha
                                                </Button>
                                            )}
                                            {!expiryDate && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditDateClick(name)}
                                                    className="text-xs"
                                                >
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Agregar fecha
                                                </Button>
                                            )}
                                            <Button 
                                                size="sm"
                                                onClick={() => handleUploadClick(name)}
                                                disabled={isUploading === name}
                                                className="text-xs"
                                            >
                                                {isUploading === name ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                                                {documentUrl ? 'Actualizar' : 'Subir'}
                                            </Button>
                                            {documentUrl && (
                                                <Button variant="ghost" size="sm" asChild className="text-xs">
                                                    <Link href={documentUrl} target="_blank">
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Ver
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Documentos de Mi Vehículo</h2>
                            {driver.vehicle && (
                                <Badge variant="secondary" className="ml-auto">{driver.vehicle.licensePlate}</Badge>
                            )}
                        </div>
                        <p className="text-sm text-slate-600">
                            {driver.vehicle 
                                ? 'Estos son los documentos asociados a tu vehículo' 
                                : 'Sube los documentos de tu vehículo. El administrador los revisará y asignará el vehículo correspondiente.'}
                        </p>
                    </div>
                    <div className="grid gap-4">
                        {vehicleDocuments.map(({ name, label, expiryDate, registrationDate }, index) => {
                            const status = driver.documentStatus?.[name] || 'pending';
                            const documentUrl = driver.documentUrls?.[name];
                            const expiryInfo = expiryDate ? getDocumentStatus(expiryDate) : null;
                            
                            return (
                                <motion.div 
                                    key={name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.4 }}
                                >
                                    <div className={cn(
                                        "border rounded-lg p-5 transition-all hover:shadow-md",
                                        individualDocStatusConfig[status].bgColor
                                    )}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <Car className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{label}</h3>
                                                    <Badge variant={individualDocStatusConfig[status].variant} className="text-xs mt-1">
                                                        {individualDocStatusConfig[status].label}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {expiryDate && (
                                            <div className="mb-2 p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-2">
                                                {expiryInfo?.icon}
                                                <span className="text-xs text-slate-700">
                                                    {expiryInfo?.label} • Vence: <span className="font-semibold">{format(parseDateString(expiryDate), 'dd/MM/yyyy')}</span>
                                                </span>
                                            </div>
                                        )}

                                        {registrationDate && (
                                            <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 text-slate-600" />
                                                <span className="text-xs text-slate-700">
                                                    Registrado: <span className="font-semibold">{format(parseDateString(registrationDate), 'dd/MM/yyyy')}</span>
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button 
                                                size="sm"
                                                onClick={() => handleUploadClick(name)}
                                                disabled={isUploading === name}
                                                className="text-xs"
                                            >
                                                {isUploading === name ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                                                {documentUrl ? 'Actualizar' : 'Subir'}
                                            </Button>
                                            {documentUrl && (
                                                <Button variant="ghost" size="sm" asChild className="text-xs">
                                                    <Link href={documentUrl} target="_blank">
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Ver
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Dialog para editar fecha */}
            <Dialog open={editDateDialogOpen} onOpenChange={setEditDateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDoc && `Actualizar ${getDateLabel(editingDoc).label}`}
                        </DialogTitle>
                        <DialogDescription>
                            {editingDoc && `Documento: ${docNameMap[editingDoc]}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {editingDoc && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-date" className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    {getDateLabel(editingDoc).label}
                                </Label>
                                <Input
                                    id="edit-date"
                                    type="date"
                                    value={getDateLabel(editingDoc).isExpiry ? expiryDate : registrationDate}
                                    onChange={(e) => {
                                        if (getDateLabel(editingDoc).isExpiry) {
                                            setExpiryDate(e.target.value);
                                        } else {
                                            setRegistrationDate(e.target.value);
                                        }
                                    }}
                                    required
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditDateDialogOpen(false);
                                setEditingDoc(null);
                                setExpiryDate('');
                                setRegistrationDate('');
                            }}
                            disabled={isUpdatingDate}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdateDate}
                            disabled={
                                isUpdatingDate ||
                                !editingDoc ||
                                (getDateLabel(editingDoc!).isExpiry ? !expiryDate : !registrationDate)
                            }
                        >
                            {isUpdatingDate ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                'Guardar Fecha'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
