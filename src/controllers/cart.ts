import { Request, Response } from "express";
import { ChangeQuantitySchema, CreateCartSchema } from "../schema/cart";
import { CartItem, Product } from "@prisma/client";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { prismaClient } from "..";
import { UnAuthorizedException } from "../exceptions/unauthorized.exception";

export const addItemToCart = async (req: Request, res: Response) => {
  const validatedData = CreateCartSchema.parse(req.body);
  let product: Product;
  try {
    product = await prismaClient.product.findFirstOrThrow({
      where: { id: validatedData.productId },
    });
  } catch (error) {
    throw new NotFoundException(
      "Product not found",
      ErrorCode.PRODUCT_NOT_FOUND
    );
  }
  const cart = await prismaClient.cartItem.create({
    data: {
      userId: req.user?.id!,
      productId: product.id,
      quantity: validatedData.quantity,
    },
  });
  res.json(cart);
};
export const getCart = async (req: Request, res: Response) => {
  const cart = await prismaClient.cartItem.findMany({
    where: { userId: req.user?.id },
    include: { product: true },
  });
  res.json(cart);
};
export const changeQuantity = async (req: Request, res: Response) => {
  const validatedData = ChangeQuantitySchema.parse(req.body);
  let cartItem: CartItem;
  try {
    cartItem = await prismaClient.cartItem.findFirstOrThrow({
      where: { id: +req.params.id },
    });
  } catch (error) {
    throw new NotFoundException(
      "Cart item not found",
      ErrorCode.CART_ITEM_NOT_FOUND
    );
  }
  if (cartItem.userId !== req.user?.id) {
    throw new UnAuthorizedException(
      "Unauthorized to update cart item",
      ErrorCode.UNAUTHORIZED
    );
  }
  const updatedCart = await prismaClient.cartItem.update({
    where: { id: +req.params.id },
    data: {
      quantity: validatedData.quantity,
    },
  });
  res.json({ success: true, updatedCart });
};
export const deleteItemFromCart = async (req: Request, res: Response) => {
  let cartItem: CartItem;
  try {
    cartItem = await prismaClient.cartItem.findFirstOrThrow({
      where: { id: +req.params.id },
    });
  } catch (error) {
    throw new NotFoundException(
      "Cart item not found",
      ErrorCode.CART_ITEM_NOT_FOUND
    );
  }
  if (cartItem.userId !== req.user?.id) {
    throw new UnAuthorizedException(
      "Unauthorized to delete cart item",
      ErrorCode.UNAUTHORIZED
    );
  }
  await prismaClient.cartItem.delete({
    where: {
      id: +req.params.id,
    },
  });
  res.json({ success: true });
};
