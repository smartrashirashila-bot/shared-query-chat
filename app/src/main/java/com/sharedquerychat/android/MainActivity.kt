package com.sharedquerychat.android

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(28, 36, 28, 36)
            setBackgroundColor(Color.rgb(12, 18, 32))
        }

        val title = TextView(this).apply {
            text = "Shared Query Chat"
            textSize = 27f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        val subtitle = TextView(this).apply {
            text = "Choose where you want to go"
            textSize = 15f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
            setPadding(0, 10, 0, 30)
        }

        val chat = makeButton("💬   Open Shared Chat")
        chat.setOnClickListener {
            startActivity(Intent(this, ChatActivity::class.java))
        }

        val hotstar = makeButton("▶   Open JioHotstar")
        hotstar.setOnClickListener { openJioHotstar() }

        root.addView(title, matchWrap())
        root.addView(subtitle, matchWrap())
        root.addView(chat, matchWrap(0, 14))
        root.addView(hotstar, matchWrap(0, 14))

        val note = TextView(this).apply {
            text = "JioHotstar opens in its official app when installed. Otherwise, its Google Play listing opens."
            textSize = 12f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
            setPadding(8, 24, 8, 0)
        }
        root.addView(note, matchWrap())
        setContentView(root)
    }

    private fun openJioHotstar() {
        val launchIntent = packageManager.getLaunchIntentForPackage("in.startv.hotstar")
        if (launchIntent != null) {
            startActivity(launchIntent)
        } else {
            val playStore = Uri.parse("https://play.google.com/store/apps/details?id=in.startv.hotstar")
            startActivity(Intent(Intent.ACTION_VIEW, playStore))
        }
    }

    private fun makeButton(label: String): Button = Button(this).apply {
        text = label
        textSize = 17f
        isAllCaps = false
        setTextColor(Color.WHITE)
        setBackgroundColor(Color.rgb(37, 99, 235))
        minHeight = 62
    }

    private fun matchWrap(top: Int = 0, bottom: Int = 0) =
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            setMargins(0, top, 0, bottom)
        }
}
