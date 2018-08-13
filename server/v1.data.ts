/**
 *    ____ _   _ _____
 *   /___ \ |_(_)___ /  ___
 *  //  / / __| | |_ \ / _ \
 * / \_/ /| |_| |___) |  __/
 * \___,_\ \__|_|____/ \___|
 */

import express from "express";
import cities from "./cities";

const router = express.Router();

router.post("/cities", function(
  req: express.Request,
  res: express.Response
): void {
  res.send(cities);
});

export { router };