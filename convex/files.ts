import { ConvexError, v } from "convex/values";
import {internalMutation, mutation,MutationCtx,query, QueryCtx} from "./_generated/server";
import { getUser } from "./users";
import { fileTypes } from "./schema";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

async function HasAccessToOrg(
    ctx:QueryCtx | MutationCtx,
    orgId:string
){
    const identity=await ctx.auth.getUserIdentity();
    if(!identity)
    {
        return null;
    }
    const user=await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier",(q)=>
    q.eq("tokenIdentifier",identity.tokenIdentifier))
    .first();
    if(!user)
    {
        return null;
    }
    const hasAccess=user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId);
    if(!hasAccess)
    {
        return null;
    }
    return {user};
}
export const generateUploadUrl = mutation(async (ctx) => {    
    const identity=await ctx.auth.getUserIdentity();
    if(!identity)
     throw new ConvexError("you must be logged in to upload a file");    
    return await ctx.storage.generateUploadUrl();
  });

export const CreateFile=mutation({
    args:{
        name:v.string(),
        fileId:v.id("_storage"),
        orgId:v.string(),
        type:fileTypes
    },
    async handler(ctx,args){    
    const hasAccess=await HasAccessToOrg(ctx,args.orgId);

    if(!hasAccess)
    {
        throw new ConvexError("you do not have access to this org");
    }
        await ctx.db.insert('files',{
        name:args.name,
        orgId:args.orgId,
        fileId:args.fileId,
        type:args.type,
        userId:hasAccess.user._id
    });
    },
});

export const Getfiles=query({
    args:{
        orgId:v.string(),
        query:v.optional(v.string()),
        favorites:v.optional(v.boolean()),
        deletedOnly:v.optional(v.boolean()),
    },
    async handler(ctx,args)
    {
        const hasAccess=await HasAccessToOrg(ctx,args.orgId);

        if(!hasAccess)
        {
            return [];
        }
        let files=await  ctx.db
                              .query("files")
                              .withIndex('by_orgId',q=>q.eq('orgId',args.orgId))
                              .collect();
        const queryword=args.query;

        if(queryword)
        { files= files.filter((file)=>
            file.name.toLowerCase().includes(queryword.toLowerCase())
        );}
        if(args.favorites)
        {
            const favorites=await ctx.db
               .query("favoritestable")
               .withIndex("by_userId_orgId_fileId",(q)=>
            q.eq("userId",hasAccess.user._id).eq("orgId",args.orgId))
             .collect();
             files=files.filter((file)=>
                favorites.some((favorite)=>favorite.fileId===file._id)
            );
        }
        if(args.deletedOnly)
            {
                 files=files.filter((file)=>file.shouldDelete);
            }
        else
        {
            files=files.filter((file)=>!file.shouldDelete);
        }

        return files;

    },
});

async function HasAccessToFile(
    ctx: QueryCtx | MutationCtx,
    fileId:Id<"files">
){
    const file=await ctx.db.get(fileId);
    
    if(!file)
    {
        return null;
    }
    const hasAccess=await HasAccessToOrg(
       ctx,
       file.orgId
       );
    if(!hasAccess)
    {
        return null;
    }
   return {user:hasAccess.user,file};
}
export const DeleteTrash=internalMutation({
    args:{},
    async handler(ctx)
    {
        const files=await ctx.db
        .query("files")
        .withIndex("by_shouldDelete",(q)=>q.eq("shouldDelete",true))
        .collect();

        await Promise.all(files.map(async (file)=>{
            await  ctx.storage.delete(file.fileId)
            return await ctx.db.delete(file._id)
        }))
    }
})
export const DeleteFile=mutation({
    args:{fileId:v.id("files")},
    async handler(ctx,args)
    {
     const access=await HasAccessToFile(ctx,args.fileId);
     if(!access)
     {
         throw new ConvexError("no access to this file");
     }
     await ctx.db.patch(args.fileId,{
        shouldDelete:true,
     });
    }
 });
 
 export const RestoreFile=mutation({
    args:{fileId:v.id("files")},
    async handler(ctx,args)
    {
     const access=await HasAccessToFile(ctx,args.fileId);
     if(!access)
     {
         throw new ConvexError("no access to this file");
     }
     await ctx.db.patch(args.fileId,{
        shouldDelete:false,
     });
    }
 });
export const addToFavorites=mutation({
    args:{fileId:v.id("files")},
    async handler(ctx,args)
    {
        const access=await HasAccessToFile(ctx,args.fileId);
        if(!access)
        {
            throw new ConvexError("no access to file");
        }
        const favoritesfiles=await ctx.db
        .query("favoritestable")
        .withIndex("by_userId_orgId_fileId",(q)=>
        q.eq("userId",access.user._id)
        .eq("orgId",access.file.orgId)
        .eq("fileId",access.file._id)).first();
        if(!favoritesfiles)
        {
           await ctx.db.insert("favoritestable",{
            fileId:access.file._id,
            userId:access.user._id,
            orgId:access.file.orgId,
           }) ;
        }
        else{
           await ctx.db.delete(favoritesfiles._id);
        }
    }
})
export const getAllFavorites=query({
    args:{orgId:v.string()},
    async handler(ctx,args)
    {
        const hasAccess=await HasAccessToOrg(
            ctx,
            args.orgId
        );
        if(!hasAccess)
        {
            return [];
        }
        const favoritesfiles=await ctx.db
        .query("favoritestable")
        .withIndex("by_userId_orgId_fileId",(q)=>
        q.eq("userId",hasAccess.user._id)
        .eq("orgId",args.orgId)).collect();
        return favoritesfiles;
        
    }
})