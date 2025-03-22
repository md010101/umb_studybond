import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { insertUserSchema } from "@db/schema";
import type { InsertUser } from "@db/schema";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { toast } = useToast();
  const { login, register } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [newCourse, setNewCourse] = useState("");

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      major: "",
      courses: [],
      availability: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      },
    },
  });

  async function onSubmit(data: InsertUser, isLogin: boolean) {
    setIsLoading(true);
    try {
      // Include courses in registration data
      const submitData = isLogin ? data : { ...data, courses };
      const result = await (isLogin ? login(submitData) : register(submitData));
      if (!result.ok) {
        throw new Error(result.message);
      }
      toast({
        title: isLogin ? "Login successful" : "Registration successful",
        description: "Welcome to sesh!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const addCourse = () => {
    if (newCourse && !courses.includes(newCourse)) {
      setCourses([...courses, newCourse]);
      setNewCourse("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
            sesh
          </CardTitle>
          <CardDescription className="text-base">
            Connect with other students for collaborative study sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UMass Boston Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@umb.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TabsContent value="register" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="major"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Major</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Courses input */}
                  <FormItem>
                    <FormLabel>Courses</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. CS 110"
                        value={newCourse}
                        onChange={(e) => setNewCourse(e.target.value)}
                      />
                      <Button type="button" onClick={addCourse}>
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {courses.map((course) => (
                        <div
                          key={course}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                        >
                          {course}
                        </div>
                      ))}
                    </div>
                  </FormItem>
                </TabsContent>

                <TabsContent value="login">
                  <Button
                    className="w-full mt-6"
                    disabled={isLoading}
                    onClick={form.handleSubmit((data) => onSubmit(data, true))}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Login"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="register">
                  <Button
                    className="w-full"
                    disabled={isLoading}
                    onClick={form.handleSubmit((data) => onSubmit(data, false))}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Register"
                    )}
                  </Button>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}