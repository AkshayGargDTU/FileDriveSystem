import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, formatDistance, formatRelative, subDays } from 'date-fns'
import { Protect } from "@clerk/nextjs";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
  
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileIcon, FileTextIcon, GanttChartIcon, ImageIcon, MoreVertical, StarIcon, TrashIcon, Undo, UndoIcon } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { ReactNode, useState } from "react";
import { api, internal } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
function FileCardActions({file}:{file:Doc<"files">})
{
    const {toast}=useToast();
    const deletefile=useMutation(api.files.DeleteFile);
    const restoreFile=useMutation(api.files.RestoreFile);
    const addtofavorite=useMutation(api.files.addToFavorites);
    
    const [isConfirmOpen,setIsConfirmOpen]=useState(false);
    return (
        <>
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
         <AlertDialogContent>
          <AlertDialogHeader>
           <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
           <AlertDialogDescription>
              This action will mark the file for deletion process.Files are deleted periodically.
           </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
           <AlertDialogCancel>Cancel</AlertDialogCancel>
           <AlertDialogAction onClick={async ()=>{
            await deletefile({fileId:file._id});
            toast({
                variant:"default",
                title:"File marked for deletion",
                description:"Your file will be deleted soon"
        
              });
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
         </AlertDialogContent>
        </AlertDialog>

        <DropdownMenu>
        <DropdownMenuTrigger><MoreVertical/></DropdownMenuTrigger>
        <DropdownMenuContent>
        <DropdownMenuItem onClick={()=>
            {
              window.open(getFileUrl(file.fileId),"_blank");
            }} className="flex gap-1 items-center cursor-pointer">
              <FileIcon className="w-4 h-4"/>Download</DropdownMenuItem>
        <DropdownMenuSeparator/>     
        <DropdownMenuItem 
        onClick={()=>{  
          addtofavorite({fileId:file._id,});}
        }
         className="flex gap-1 items-center cursor-pointer">
        <StarIcon className="w-4 h-4"/>Add to favorites
        </DropdownMenuItem>
        <Protect
         role="org:admin"
      fallback={<></>}>
        <DropdownMenuSeparator/>
        <DropdownMenuItem 
        onClick={()=>{
          if(file.shouldDelete)
          {
             restoreFile({fileId:file._id})
          }
          else
          {
            setIsConfirmOpen(true)
          }
        }}
        className="flex gap-1  items-center cursor-pointer">
        {file.shouldDelete ?
        (<div className="flex gap-1 text-green-600 items-center cursor-pointer">
          <UndoIcon className="w-4 h-4"/>Restore</div>)
          :<div className="flex gap-1 text-red-600 items-center cursor-pointer">
          <TrashIcon className="w-4 h-4"/>Delete</div> }
        </DropdownMenuItem>
        </Protect>
        </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
 }  
function getFileUrl(fileId:Id<"_storage">):string{
  return `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${fileId}`;
}
export function FileCard({file}:{file:Doc<"files">})
{
  const userProfile=useQuery(api.users.getUserProfile,{
    userId:file.userId,
  }); 
  const typeIcons={
    "image":<ImageIcon/>,
    "pdf":<FileTextIcon/>,
    "csv":<GanttChartIcon/>
   }  as Record<Doc<"files">["type"],ReactNode>
  return (
        <Card>
        <CardHeader className="relative">
          <CardTitle className="flex gap-2 text-base font-normal"><div className="flex justify-center">{typeIcons[file.type]}</div>{file.name}</CardTitle>
          <div className="absolute top-2 right-2"><FileCardActions file={file}/></div>
        </CardHeader>
        <CardContent className="h-[200px] flex justify-center items-center">
          {file.type==="image" && (
          <Image 
        alt={file.name} 
        width="100" 
        height="100" 
        src={getFileUrl(file.fileId)}
        />
        ) }
        {file.type==="csv" && <GanttChartIcon className="w-20 h-20"/>}
        {file.type==="pdf" && <FileTextIcon className="w-20 h-20"/>}
        </CardContent>
        <CardFooter className="flex justify-between">
        <div className="flex gap-2 text-xs text-gray-700 w-40 items-center">
          <Avatar className="h-6 w-6 ">
           <AvatarImage src={userProfile?.image} />
           <AvatarFallback>CN</AvatarFallback>
        </Avatar>{userProfile?.name}
        </div>
        <div className="text-xs text-gray-700">Uploaded on{" "}{formatRelative(new Date(file._creationTime),new Date())}</div>
        </CardFooter>
      </Card>      
     )
}