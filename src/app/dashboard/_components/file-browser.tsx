"use client";

import Image from "next/image";
import {useOrganization, useUser } from "@clerk/nextjs";
import {useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card";
import { Loader2} from "lucide-react";
import { SearchBar } from "./search-bar";
import { useState } from "react";

function PlaceholderState()
{
   return (
    <div className="flex flex-col gap-8 w-full items-center mt-20">
      <Image
       alt="image for empty drive" 
       height="300" width="300" 
       src="/empty.svg"/>
    
    <div className="text-2xl">No files uploaded</div>
    <UploadButton/>
    </div>
   )  
}

export  function FileBrowser(
  {title,
   favoritesOnly,
   deletedOnly,
  }:{
      title:string;
      favoritesOnly?:boolean;
      deletedOnly?:boolean;
    }){
  const organization=useOrganization();
  const user=useUser();
  const [query,setQuery]=useState("");
  let orgId:string | undefined=undefined;
  if(organization.isLoaded && user.isLoaded)
  {
    orgId=organization.organization?.id ?? user.user?.id;
  }
  const favorites=useQuery(api.files.getAllFavorites,
    orgId?{orgId}:"skip");

  const files=useQuery(
    api.files.Getfiles ,orgId ? {orgId,query,favorites:favoritesOnly,deletedOnly} :"skip");
  const isLoading= files===undefined;
  return (
      <div className="w-full">
      {isLoading && (
        <div className="flex flex-col gap-8 w-full items-center mt-24">
        <Loader2 className="h-32 w-32 animate-spin text-gray-500"/>
        <div className="text-2xl">Loading your files</div>
        </div>
      )}

      {!isLoading  && (
        <>
        <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold">{title}</h1>
      
      <SearchBar query={query} setQuery={setQuery}/>
      <UploadButton/> 
      </div>

      {files.length===0 && <PlaceholderState/>}

      <div className="grid grid-cols-3 gap-4">
       {files?.map(file=>{
        return <FileCard key={file._id} file={file}/>
       })}
      </div>  
        </>
      )}
      </div>    
  );
}