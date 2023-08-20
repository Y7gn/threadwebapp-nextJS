"use client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserValidation } from "@/lib/validations/user";
import * as z from "zod";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { Button } from "../ui/button";
import { ChangeEvent, useState } from "react";
import { isBase64Image } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { updateUser } from "@/lib/actions/user.actions";
import { usePathname, useRouter } from "next/navigation";
interface Porps {
  user: {
    id: string;
    objectId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
  };
  btnTitle: string;
}
// in /onBoarding
// form contain of  FormLabel And FormControl
//this page is for changing account settings

const AccountProfile = ({ user, btnTitle }: Porps) => {
  const [files, setFiles] = useState<File[]>([]);
  const { startUpload } = useUploadThing<any>("media");
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm({
    // according to form shadcn/ui documentation we have ti define the form (last step)
    resolver: zodResolver(UserValidation), //zod resolver
    defaultValues: {
      //default username
      //where are going to have data from clerk and we can display it in form when editing account info
      profile_photo: user?.image || "",
      name: user?.name || "",
      username: user?.username || "",
      bio: user?.bio || "",
    },
  });

  //to handle the image display on the UI
  const handleImage = (
    //first prevent from refresh, then create instance, if files is larget than one and exists, read it and set it in files hook
    //after this if it's not image stop , and when the image loads set it inside imageDataUrl and display it using fieldChange (to update the field)
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader(); // a built-in browser API allows you to read the contents of a file asynchronously.
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]; //read the file

      setFiles(Array.from(e.target.files)); //set it (FileList object, into a regular array.)

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        //Inside the onload event handler, the function extracts the data URL of the loaded image from the event.target.result property.
        //This data URL is a base64-encoded representation of the image's content.
        const imageDataUrl = event.target?.result?.toString() || "";

        fieldChange(imageDataUrl); // we are using react hook form to update field
      };

      //This is where you can access the data URL representation of the image and perform further actions,
      //such as updating the form field with the data URL.
      fileReader.readAsDataURL(file);
    }
  };

  //going to upload new image and update user in the database (mongoDB)
  const onSubmit = async (values: z.infer<typeof UserValidation>) => {
    // to submit with typeof UserValidation in lib/user.ts
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    const blob = values.profile_photo;

    const hasImageChanged = isBase64Image(blob); // check if badse64

    if (hasImageChanged) {
      const imgRes = await startUpload(files); //upload it to cloud and get url

      if (imgRes && imgRes[0].fileUrl) {
        values.profile_photo = imgRes[0].fileUrl;
      }
    }

    //  UPDATE USER PROFILE
    await updateUser({
      userId: user.id,
      username: values.username,
      name: values.name,
      image: values.profile_photo,
      bio: values.bio,
      path: pathname,
    });

    if (pathname === "/profile/edit") {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 flex flex-col justify-start gap-10"
      >
        <FormField
          control={form.control}
          name="profile_photo"
          render={({ field }) => {
            return (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="account-form_image-label">
                  {field.value ? (
                    <Image
                      src={field.value}
                      alt="profile photo"
                      width={96}
                      height={96}
                      priority
                      className="rounded-full object-contain"
                    />
                  ) : (
                    <Image
                      src="/assets/profile.svg"
                      alt="profile photo"
                      width={96}
                      height={96}
                      className="object-contain"
                    />
                  )}
                </FormLabel>
                <FormControl className="flex-1 text-base-semibold text-gray-200">
                  <Input
                    type="file"
                    accept="image/*"
                    placeholder="Upload A Photo"
                    className="account-form_image-input"
                    onChange={(e) => handleImage(e, field.onChange)} //special case to handle the image
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            return (
              <FormItem className="flex flex-col w-full gap-3">
                <FormLabel className="text-base-semibold text-light-2">
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    className="account-form_input no-focus"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => {
            return (
              <FormItem className="flex items-center gap-3 w-full">
                <FormLabel className="text-base-semibold text-light-2">
                  Username
                </FormLabel>
                <FormControl className="flex-1 text-base-semibold text-gray-200">
                  <Input
                    type="text"
                    className="account-form_input no-focus"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => {
            return (
              <FormItem className="flex items-center gap-3 w-full">
                <FormLabel className="text-base-semibold text-light-2">
                  Bio
                </FormLabel>
                <FormControl className="flex-1 text-base-semibold text-gray-200">
                  <textarea
                    rows={10}
                    className="account-form_input no-focus"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <Button type="submit" className="bg-primary-500">
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default AccountProfile;
