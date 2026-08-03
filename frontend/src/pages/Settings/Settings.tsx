import { User, Bell, Palette, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-col h-auto w-full md:w-[250px] items-stretch justify-start p-1 bg-transparent space-y-1">
          <TabsTrigger value="profile" className="justify-start px-4 py-2.5 data-[state=active]:bg-surface data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-3" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="justify-start px-4 py-2.5 data-[state=active]:bg-surface data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-3" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="justify-start px-4 py-2.5 data-[state=active]:bg-surface data-[state=active]:shadow-sm">
            <Palette className="w-4 h-4 mr-3" /> Appearance
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="profile" className="mt-0 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Update your primary account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue="Dr. Sarah Johnson" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="sarah.johnson@hospital.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue="Ophthalmologist" readOnly className="bg-muted" />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button variant="secondary">Update Password</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure how you receive alerts and updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-sm font-medium">Email Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="email-1" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                        <label htmlFor="email-1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Analysis completed</label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="email-2" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                        <label htmlFor="email-2" className="text-sm font-medium leading-none">High-risk patient detected</label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="email-3" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="email-3" className="text-sm font-medium leading-none text-muted-foreground">Weekly summary report</label>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="mb-4 text-sm font-medium">In-App Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="app-1" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                        <label htmlFor="app-1" className="text-sm font-medium leading-none">Real-time analysis updates</label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="app-2" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                        <label htmlFor="app-2" className="text-sm font-medium leading-none">Patient activity</label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button><Save className="w-4 h-4 mr-2" /> Save Preferences</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the interface of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4 max-w-md">
                      <div className="border-2 border-transparent active:border-primary rounded-lg overflow-hidden cursor-pointer p-1">
                        <div className="bg-slate-50 w-full h-16 rounded-md border flex items-center justify-center font-medium text-slate-900 shadow-sm">Light</div>
                      </div>
                      <div className="border-2 border-primary rounded-lg overflow-hidden cursor-pointer p-1">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-900 w-full h-16 rounded-md border flex items-center justify-center font-medium text-slate-500 shadow-sm">System</div>
                      </div>
                      <div className="border-2 border-transparent hover:border-primary/50 text-slate-100 rounded-lg overflow-hidden cursor-pointer p-1">
                        <div className="bg-slate-900 w-full h-16 rounded-md border border-slate-800 flex items-center justify-center font-medium shadow-sm">Dark</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t max-w-sm">
                    <Label htmlFor="language">Language</Label>
                    <select id="language" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button><Save className="w-4 h-4 mr-2" /> Apply Settings</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
