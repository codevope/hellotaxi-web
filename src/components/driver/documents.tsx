

'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Upload, Car, User, Calendar, Eye, CheckCircle2, CalendarIcon } from 'lucide-react';
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

const individualDocStatusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
    approved: { label: 'Aprobado', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'outline' },
    rejected: { label: 'Rechazado', variant: 'destructive' },
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
        // Bloquear si el conductor ya está aprobado
        if (driver.documentsStatus === 'approved') {
            toast({
                variant: 'destructive',
                title: 'Documentos Aprobados',
                description: 'Tus documentos ya han sido aprobados. No puedes modificarlos en este momento.',
            });
            return;
        }

        setSelectedDoc(docName);
        // Reset dates
        setExpiryDate('');
        setRegistrationDate('');
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedDoc) return;

        setSelectedFile(file);
        
        // Pre-rellenar fechas existentes solo para documentos personales
        if (selectedDoc === 'dni' && driver.dniExpiry) {
            setExpiryDate(driver.dniExpiry.split('T')[0]);
        } else if (selectedDoc === 'license' && driver.licenseExpiry) {
            setExpiryDate(driver.licenseExpiry.split('T')[0]);
        } else if (selectedDoc === 'backgroundCheck' && driver.backgroundCheckExpiry) {
            setExpiryDate(driver.backgroundCheckExpiry.split('T')[0]);
        }
        // Las fechas del vehículo las ingresa el admin, no el conductor

        setUploadDialogOpen(true);
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile || !selectedDoc) return;

        setIsUploading(selectedDoc);
        setUploadDialogOpen(false);

        try {
            // Crear FormData para enviar el archivo
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('driverId', driver.id);
            formData.append('documentName', selectedDoc);

            // Llamar al API route
            const response = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al subir el documento');
            }

            // Preparar updates para Firestore
            const driverRef = doc(db, 'drivers', driver.id);
            const updates: any = {
                [`documentUrls.${selectedDoc}`]: data.url,
                [`documentStatus.${selectedDoc}`]: 'pending',
                documentsStatus: 'pending'
            };

            // Actualizar fechas según el documento
            if (selectedDoc === 'dni' && expiryDate) {
                updates.dniExpiry = new Date(expiryDate).toISOString();
            } else if (selectedDoc === 'license' && expiryDate) {
                updates.licenseExpiry = new Date(expiryDate).toISOString();
            } else if (selectedDoc === 'backgroundCheck' && expiryDate) {
                updates.backgroundCheckExpiry = new Date(expiryDate).toISOString();
            }

            // Las fechas del vehículo las ingresa el admin, no el conductor
            // Removido: código para actualizar fechas del vehículo

            // Actualizar conductor
            await updateDoc(driverRef, updates);

            // Actualizar el estado local con la nueva URL
            const updatedDriver: EnrichedDriver = {
                ...driver,
                documentUrls: {
                    dni: driver.documentUrls?.dni || '',
                    license: driver.documentUrls?.license || '',
                    propertyCard: driver.documentUrls?.propertyCard || '',
                    insurance: driver.documentUrls?.insurance || '',
                    technicalReview: driver.documentUrls?.technicalReview || '',
                    backgroundCheck: driver.documentUrls?.backgroundCheck || '',
                    [selectedDoc]: data.url,
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
                title: 'Documento Subido',
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
            // Limpiar el input
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
        // Solo documentos personales necesitan fecha del conductor
        return ['dni', 'license', 'backgroundCheck'].includes(docName);
    };

    const handleEditDateClick = (docName: DocumentName) => {
        // Solo permitir edición de fechas para documentos personales, bloqueado si está aprobado
        if (driver.documentsStatus === 'approved') {
            toast({
                variant: 'destructive',
                title: 'Documentos Aprobados',
                description: 'Tus documentos ya han sido aprobados. No puedes modificarlos en este momento.',
            });
            return;
        }

        // Las fechas de documentos del vehículo las ingresa el admin
        if (['insurance', 'technicalReview', 'propertyCard'].includes(docName)) {
            toast({
                variant: 'default',
                title: 'Fecha gestionada por el administrador',
                description: 'Las fechas de los documentos del vehículo son ingresadas por el administrador.',
            });
            return;
        }
        
        setEditingDoc(docName);
        
        // Pre-rellenar fecha existente solo para documentos personales
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

            // Actualizar fechas según el documento
            if (editingDoc === 'dni' && expiryDate) {
                updates.dniExpiry = new Date(expiryDate).toISOString();
            } else if (editingDoc === 'license' && expiryDate) {
                updates.licenseExpiry = new Date(expiryDate).toISOString();
            } else if (editingDoc === 'backgroundCheck' && expiryDate) {
                updates.backgroundCheckExpiry = new Date(expiryDate).toISOString();
            }

            // Las fechas del vehículo las ingresa el admin, no el conductor
            // Solo actualizamos documentos personales

            // Actualizar conductor si hay cambios
            if (Object.keys(updates).length > 0) {
                await updateDoc(driverRef, updates);
            }

            // Actualizar el estado local
            const updatedDriver = {
                ...driver,
                ...(editingDoc === 'dni' && expiryDate ? { dniExpiry: new Date(expiryDate).toISOString() } : {}),
                ...(editingDoc === 'license' && expiryDate ? { licenseExpiry: new Date(expiryDate).toISOString() } : {}),
                ...(editingDoc === 'backgroundCheck' && expiryDate ? { backgroundCheckExpiry: new Date(expiryDate).toISOString() } : {}),
                vehicle: driver.vehicle
            };

            onUpdate(updatedDriver);

            toast({
                title: 'Fecha actualizada',
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
    
    // Separating driver personal documents from vehicle documents
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
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
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
                <Card>
                    <CardHeader>
                        <CardTitle>Mis Documentos Personales</CardTitle>
                        <CardDescription>
                            Mantén tus documentos personales actualizados para poder recibir viajes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {personalDocuments.map(({ name, label, expiryDate }) => {
                            const status = driver.documentStatus?.[name] || 'pending';
                            const documentUrl = driver.documentUrls?.[name];
                            const expiryInfo = expiryDate ? getDocumentStatus(expiryDate) : null;
                            const isPdf = documentUrl?.endsWith('.pdf');
                            
                            return (
                                <Card key={name} className={cn(status === 'rejected' && "border-destructive bg-destructive/5")}>
                                    <CardHeader>
                                        <div className="space-y-3">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2 mb-2">
                                                    <User className="h-5 w-5" />
                                                    <span>{label}</span>
                                                </CardTitle>
                                                <Badge variant={individualDocStatusConfig[status].variant} className="text-xs w-fit">
                                                    {individualDocStatusConfig[status].label}
                                                </Badge>
                                            </div>
                                            {expiryDate ? (
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <CardDescription className={cn("flex items-center gap-1.5", expiryInfo?.color)}>
                                                        {expiryInfo?.icon}
                                                        <span className="text-xs sm:text-sm">{expiryInfo?.label} (Vence: {format(new Date(expiryDate), 'dd/MM/yyyy')})</span>
                                                    </CardDescription>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditDateClick(name)}
                                                        className="h-6 px-2 text-xs w-fit"
                                                    >
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        Editar
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditDateClick(name)}
                                                    className="w-fit"
                                                >
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Agregar fecha de vencimiento
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {documentUrl && (
                                            <div className="border rounded-lg p-4 bg-muted/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        Documento actual
                                                    </span>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={documentUrl} target="_blank" className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            Ver
                                                        </Link>
                                                    </Button>
                                                </div>
                                                {!isPdf && (
                                                    <div className="relative h-32 w-full rounded-md overflow-hidden bg-muted">
                                                        <Image
                                                            src={documentUrl}
                                                            alt={label}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                )}
                                                {isPdf && (
                                                    <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                                                        <FileText className="h-8 w-8 text-red-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">Documento PDF</p>
                                                            <p className="text-xs text-muted-foreground">Haz clic en "Ver" para abrir</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <Button 
                                            className="w-full sm:w-auto"
                                            onClick={() => handleUploadClick(name)}
                                            disabled={isUploading === name}
                                        >
                                            {isUploading === name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {documentUrl ? 'Actualizar Documento' : 'Subir Documento'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Documentos de Mi Vehículo</CardTitle>
                        <CardDescription>
                            {driver.vehicle ? (
                                <>Estos son los documentos asociados al vehículo con placa <Badge variant="secondary">{driver.vehicle.licensePlate}</Badge>.</>
                            ) : (
                                <>Sube los documentos de tu vehículo. El administrador los revisará y asignará el vehículo correspondiente.</>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         {vehicleDocuments.map(({ name, label, expiryDate, registrationDate }) => {
                            const status = driver.documentStatus?.[name] || 'pending';
                            const documentUrl = driver.documentUrls?.[name];
                            const expiryInfo = expiryDate ? getDocumentStatus(expiryDate) : null;
                            const isPdf = documentUrl?.endsWith('.pdf');
                            
                            return (
                                <Card key={name} className={cn(status === 'rejected' && "border-destructive bg-destructive/5")}>
                                    <CardHeader>
                                        <div className="space-y-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Car className="h-5 w-5" />
                                                <span>{label}</span>
                                            </CardTitle>
                                            <Badge variant={individualDocStatusConfig[status].variant} className="text-xs w-fit">
                                                {individualDocStatusConfig[status].label}
                                            </Badge>
                                            {expiryDate && (
                                                <CardDescription className={cn("flex items-center gap-1.5 pt-1", expiryInfo?.color)}>
                                                    {expiryInfo?.icon}
                                                    <span className="text-xs sm:text-sm">{expiryInfo?.label} (Vence: {format(new Date(expiryDate), 'dd/MM/yyyy')})</span>
                                                </CardDescription>
                                            )}
                                            {registrationDate && (
                                                <CardDescription className="flex items-center gap-1.5 pt-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    <span className="text-xs sm:text-sm">Registrado: {format(new Date(registrationDate), 'dd/MM/yyyy')}</span>
                                                </CardDescription>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {documentUrl && (
                                            <div className="border rounded-lg p-4 bg-muted/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        Documento actual
                                                    </span>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={documentUrl} target="_blank" className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            Ver
                                                        </Link>
                                                    </Button>
                                                </div>
                                                {!isPdf && (
                                                    <div className="relative h-32 w-full rounded-md overflow-hidden bg-muted">
                                                        <Image
                                                            src={documentUrl}
                                                            alt={label}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                )}
                                                {isPdf && (
                                                    <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                                                        <FileText className="h-8 w-8 text-red-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">Documento PDF</p>
                                                            <p className="text-xs text-muted-foreground">Haz clic en "Ver" para abrir</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <Button 
                                            className="w-full sm:w-auto"
                                            onClick={() => handleUploadClick(name)}
                                            disabled={isUploading === name}
                                        >
                                            {isUploading === name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {documentUrl ? 'Actualizar Documento' : 'Subir Documento'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </CardContent>
                </Card>
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
