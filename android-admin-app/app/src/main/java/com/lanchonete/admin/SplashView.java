package com.lanchonete.admin;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;

/**
 * Splash nativa do aplicativo administrativo.
 * Desenha a marca CV em laranja/preto e um indicador de carregamento animado.
 */
public final class SplashView extends View {
    private static final int BG = Color.rgb(13, 13, 13);
    private static final int ORANGE = Color.rgb(245, 130, 19);
    private static final int DARK = Color.rgb(25, 25, 25);
    private static final int TRACK = Color.rgb(54, 54, 54);
    private static final int TEXT = Color.rgb(205, 205, 205);

    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path cPath = new Path();
    private final Path vPath = new Path();
    private final RectF spinnerRect = new RectF();

    private float spinnerAngle = -90f;
    private boolean running = true;

    public SplashView(Context context) {
        super(context);
        setBackgroundColor(BG);
        setClickable(true);
        setFocusable(true);

        textPaint.setColor(TEXT);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setTypeface(android.graphics.Typeface.create("sans", android.graphics.Typeface.NORMAL));
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        final float w = getWidth();
        final float h = getHeight();
        if (w <= 0 || h <= 0) return;

        drawSubtleAccents(canvas, w, h);

        float logoWidth = Math.min(w * 0.62f, dp(330));
        float logoCenterY = h * 0.43f;
        drawCvLogo(canvas, w / 2f, logoCenterY, logoWidth);

        float spinnerSize = dp(48);
        float spinnerCenterY = h * 0.64f;
        spinnerRect.set(
                w / 2f - spinnerSize / 2f,
                spinnerCenterY - spinnerSize / 2f,
                w / 2f + spinnerSize / 2f,
                spinnerCenterY + spinnerSize / 2f
        );

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeWidth(dp(4));
        paint.setColor(TRACK);
        canvas.drawArc(spinnerRect, 0, 360, false, paint);

        paint.setColor(ORANGE);
        canvas.drawArc(spinnerRect, spinnerAngle, 105, false, paint);

        textPaint.setTextSize(sp(17));
        canvas.drawText("Carregando...", w / 2f, spinnerCenterY + dp(66), textPaint);

        if (running) {
            spinnerAngle = (spinnerAngle + 5.5f) % 360f;
            postInvalidateOnAnimation();
        }
    }

    private void drawSubtleAccents(Canvas canvas, float w, float h) {
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(dp(1.2f));
        paint.setColor(Color.argb(120, 245, 130, 19));

        RectF topArc = new RectF(-w * 0.38f, -w * 0.38f, w * 0.28f, w * 0.28f);
        canvas.drawArc(topArc, 12, 82, false, paint);

        RectF bottomArc = new RectF(w * 0.72f, h - w * 0.28f, w * 1.38f, h + w * 0.38f);
        canvas.drawArc(bottomArc, 192, 82, false, paint);
    }

    private void drawCvLogo(Canvas canvas, float cx, float cy, float width) {
        float height = width * 0.56f;
        float left = cx - width / 2f;
        float top = cy - height / 2f;

        cPath.reset();
        cPath.moveTo(left + width * 0.72f, top + height * 0.18f);
        cPath.lineTo(left + width * 0.35f, top + height * 0.18f);
        cPath.cubicTo(
                left + width * 0.18f, top + height * 0.18f,
                left + width * 0.10f, top + height * 0.32f,
                left + width * 0.10f, top + height * 0.50f
        );
        cPath.cubicTo(
                left + width * 0.10f, top + height * 0.68f,
                left + width * 0.18f, top + height * 0.82f,
                left + width * 0.35f, top + height * 0.82f
        );
        cPath.lineTo(left + width * 0.61f, top + height * 0.82f);

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setStrokeCap(Paint.Cap.SQUARE);

        paint.setColor(ORANGE);
        paint.setStrokeWidth(width * 0.090f);
        canvas.drawPath(cPath, paint);

        paint.setColor(DARK);
        paint.setStrokeWidth(width * 0.052f);
        canvas.drawPath(cPath, paint);

        vPath.reset();
        vPath.moveTo(left + width * 0.55f, top + height * 0.35f);
        vPath.lineTo(left + width * 0.72f, top + height * 0.80f);
        vPath.lineTo(left + width * 0.93f, top + height * 0.19f);

        paint.setStrokeJoin(Paint.Join.MITER);
        paint.setStrokeCap(Paint.Cap.SQUARE);
        paint.setColor(ORANGE);
        paint.setStrokeWidth(width * 0.092f);
        canvas.drawPath(vPath, paint);

        paint.setColor(DARK);
        paint.setStrokeWidth(width * 0.054f);
        canvas.drawPath(vPath, paint);
    }

    public void stopAnimation() {
        running = false;
    }

    private float dp(float value) {
        return value * getResources().getDisplayMetrics().density;
    }

    private float sp(float value) {
        return value * getResources().getDisplayMetrics().scaledDensity;
    }
}
