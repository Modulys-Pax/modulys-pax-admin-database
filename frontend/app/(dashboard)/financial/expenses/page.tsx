'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Package, Truck, MoreHorizontal } from 'lucide-react';

// Tabs components
import { EmployeesExpensesTab } from './components/employees-tab';
import { StockExpensesTab } from './components/stock-tab';
import { FleetExpensesTab } from './components/fleet-tab';
import { OtherExpensesTab } from './components/other-tab';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        subtitle="Visão consolidada de todas as despesas da empresa"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Funcionários</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Almoxarifado</span>
          </TabsTrigger>
          <TabsTrigger value="fleet" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Frota</span>
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2">
            <MoreHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Outros</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeesExpensesTab />
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <StockExpensesTab />
        </TabsContent>

        <TabsContent value="fleet" className="mt-6">
          <FleetExpensesTab />
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <OtherExpensesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
