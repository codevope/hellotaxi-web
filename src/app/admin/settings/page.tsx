import SettingsForm from '@/components/admin/settings-form';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, CreditCard } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Ajustes de la Aplicación
          </h1>
        </div>
      </div>
      
      <Tabs defaultValue="general" className="w-full">        
        <TabsContent value="general" className="mt-6">
          <SettingsForm />
        </TabsContent>
        
        <TabsContent value="membership-payments" className="mt-6">
       
        </TabsContent>
      </Tabs>
    </div>
  );
}
